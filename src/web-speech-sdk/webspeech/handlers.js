import {
    RNNOISE_SAMPLE_LENGTH,
} from '../rnnoise/index.js'

// Event Handling functions, those will bind to the WebSpeech instance
export const downSamplerHandler = function (audioFrame) {
    this.downSampler.postMessage({
        method: "process",
        audioFrame: audioFrame.detail
    })
}

export const speechPreEmphasisHandler = function (audioFrame) {
    this.speechPreEmphaser.postMessage({
        method: "process",
        audioFrame: audioFrame.detail
    })
}

export const featureExtractorHandler = function (audioFrame) {
    //accumulate audioframes until analysis window is full
    if (this.featureExtractor.windowBuffer.length == this.featureExtractor.options.windowLength) {
        this.featureExtractor.postMessage({
            method: "process",
            audioFrame: Float32Array.from(this.featureExtractor.windowBuffer)
        })
        // slide by windowStride
        this.featureExtractor.windowBuffer = this.featureExtractor.windowBuffer.slice(-this.featureExtractor.options.windowStride)
    }
    this.featureExtractor.windowBuffer = [...this.featureExtractor.windowBuffer, ...audioFrame.detail]
}

export const vadOnAudioProcessHandler = async function (audioEvent) {
    // Prepend the residue PCM buffer from the previous process callback
    const inData = audioEvent.inputBuffer.getChannelData(0)
    const completeInData = [...this.VAD.bufferResidue, ...inData]
    let i = 0
    for (; i + RNNOISE_SAMPLE_LENGTH < completeInData.length; i += RNNOISE_SAMPLE_LENGTH) {
        const pcmSample = completeInData.slice(i, i + RNNOISE_SAMPLE_LENGTH)
        const vadScore = this.VAD.calculateAudioFrameVAD(pcmSample)
        if (this.VAD.activations.length == this.VAD.numActivations) this.VAD.activations.shift()
        this.VAD.activations.push(0 + (vadScore > this.VAD.threshold))
        let activations = this.VAD.activations.reduce((accum, val) => accum + val)
        if (vadScore >= this.VAD.threshold && this.VAD.redemptionTimer) {
            clearTimeout(this.VAD.redemptionTimer)
            this.VAD.redemptionTimer = false
        }
        if ((vadScore < this.VAD.threshold) && !this.VAD.redemptionTimer && this.VAD.speaking) {
            this.VAD.redemptionTimer = setTimeout(() => {
                if (this.VAD) {
                    this.VAD.speaking = false
                    this.dispatchEvent(new CustomEvent("speaking", {
                        "detail": false
                    }))

                }
            }, this.VAD.timeAfterStop)
        }
        if ((activations >= this.VAD.numActivations) && !this.VAD.speaking) {
            this.VAD.speaking = true
            this.dispatchEvent(new CustomEvent("speaking", {
                "detail": true
            }))
        }
    }
    this.VAD.bufferResidue = completeInData.slice(i, completeInData.length);
}

export const hotWordHandler = function (mfcc) {
    if (this.hotWord.mfccBuffer.length < 30) {
        this.hotWord.mfccBuffer.push(mfcc.detail.data)
    } else {
        this.hotWord.mfccBuffer.shift()
        this.hotWord.mfccBuffer.push(mfcc.detail.data)
        this.hotWord.postMessage({
            method: "process",
            features: this.hotWord.mfccBuffer
        })
    }
}