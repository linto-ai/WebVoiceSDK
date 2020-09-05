import rnnoiseloader from './loader'
export const RNNOISE_SAMPLE_LENGTH = 480
const RNNOISE_BUFFER_SIZE = RNNOISE_SAMPLE_LENGTH * 4

// Wrapper for rnnoise WASM module
export class Rnnoise {

    constructor() {
        this.destroyed = false
        this.init()
    }

    async init() {
        try {
            this.wasmInterface = await rnnoiseloader() // vendor (jitsi meet) script that loads wasm file
            this.wasmPcmInput = this.wasmInterface._malloc(RNNOISE_BUFFER_SIZE)
            if (!this.wasmPcmInput) throw Error('Failed to create wasm input memory buffer')
            this.wasmPcmOutput = this.wasmInterface._malloc(RNNOISE_BUFFER_SIZE)
            if (!this.wasmPcmOutput) {
                this.wasmInterface._free(this.wasmPcmInput)
                throw Error('Failed to create wasm output memory buffer')
            }
            // The HEAPF32.set function requires an index relative to a Float32 array view of the wasm memory model
            // which is an array of bytes. This means we have to divide it by the size of a float to get the index
            // relative to a Float32 Array.
            if (this.wasmPcmInput) {
                this.wasmPcmInputF32Index = this.wasmPcmInput / 4
            }
            this.context = this.wasmInterface._rnnoise_create()
        } catch (e) {
            this.releaseWasmResources()
            throw e
        }
        return this
    }

    releaseWasmResources() {
        // For VAD score purposes only allocate the buffers once and reuse them
        if (this.wasmPcmInput) {
            this.wasmInterface._free(this.wasmPcmInput)
            this.wasmPcmInput = null
        }

        if (this.wasmPcmOutput) {
            this.wasmInterface._free(this.wasmPcmOutput)
            this.wasmPcmOutput = null
        }

        if (this.context) {
            this.wasmInterface._rnnoise_destroy(this.context)
            this.context = null
        }
    }

    /**
     * Calculate the Voice Activity Detection for a raw Float32 PCM sample Array.
     * The size of the array must be of exactly 480 samples, this constraint comes from the rnnoise library.
     *
     * @param {Float32Array} pcmFrame - Array containing 32 bit PCM samples.
     * @returns {Float} Contains VAD score in the interval 0 - 1 i.e. 0.90 .
     */
    calculateAudioFrameVAD(pcmFrame) {
        if (this.destroyed) {
            throw new Error('RnnoiseProcessor instance is destroyed, please create another one!')
        }

        const pcmFrameLength = pcmFrame.length;

        if (pcmFrameLength !== RNNOISE_SAMPLE_LENGTH) {
            throw new Error(`Rnnoise can only process PCM frames of 480 samples! Input sample was:${pcmFrameLength}`)
        }

        this.convertTo16BitPCM(pcmFrame)
        this.copyPCMSampleToWasmBuffer(pcmFrame)
        return this.wasmInterface._rnnoise_process_frame(this.context, this.wasmPcmOutput, this.wasmPcmInput)
    }

    /**
     * Convert 32 bit Float PCM samples to 16 bit Float PCM samples and store them in 32 bit Floats.
     *
     * @param {Float32Array} f32Array - Array containing 32 bit PCM samples.
     * @returns {void}
     */
    convertTo16BitPCM(f32Array) {
        f32Array.forEach((value, index) => {
            f32Array[index] = value * 0x7fff;
        });
    }


    /**
     * Copy the input PCM Audio Sample to the wasm input buffer.
     *
     * @param {Float32Array} pcmSample - Array containing 16 bit format PCM sample stored in 32 Floats .
     * @returns {void}
     */
    copyPCMSampleToWasmBuffer(pcmSample) {
        this.wasmInterface.HEAPF32.set(pcmSample, this.wasmPcmInputF32Index);
    }

    /**
     * Release any resources required by the rnnoise context this needs to be called
     * before destroying any context that uses the processor.
     *
     * @returns {void}
     */
    destroy() {
        // Attempting to release a non initialized processor, do nothing.
        if (this.destroyed) {
            return
        }
        this.releaseWasmResources()
        this.destroyed = true
    }

}