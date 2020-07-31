import Node from '../nodes/node.js'
import {
    RNNOISE_SAMPLE_LENGTH,
    Rnnoise
} from '../rnnoise/index.js'


const handler = function (nodeEvent) {
    // Prepend the residue PCM buffer from the previous process callback
    const inData = nodeEvent.detail
    const completeInData = [...this.bufferResidue, ...inData]
    let i = 0
    for (; i + RNNOISE_SAMPLE_LENGTH < completeInData.length; i += RNNOISE_SAMPLE_LENGTH) {
        const pcmSample = completeInData.slice(i, i + RNNOISE_SAMPLE_LENGTH)
        const vadScore = this.wasmRuntime.calculateAudioFrameVAD(pcmSample)
        if (this.activations.length == this.options.numActivations) this.activations.shift()
        this.activations.push(0 + (vadScore > this.options.threshold))
        let activations = this.activations.reduce((accum, val) => accum + val)
        // @TODO : Rework this shitty hysteresis (ashamed i am)
        if (vadScore >= this.options.threshold && this.redemptionTimer) {
            clearTimeout(this.redemptionTimer)
            this.redemptionTimer = false
        }
        if ((vadScore < this.options.threshold) && !this.redemptionTimer && this.speaking) {
            this.redemptionTimer = setTimeout(() => {
                if (this.wasmRuntime) {
                    this.speaking = false
                    this.dispatchEvent(new CustomEvent(this.event, {
                        "detail": false
                    }))
                }
            }, this.options.timeAfterStop)
        }
        if ((activations >= this.options.numActivations) && !this.speaking) {
            this.speaking = true
            this.dispatchEvent(new CustomEvent(this.event, {
                "detail": true
            }))
        }
    }
    this.bufferResidue = completeInData.slice(i, completeInData.length)
}

export default class Vad extends Node {
    static defaultOptions = {
        numActivations: 10,
        threshold: 0.85,
        timeAfterStop: 800
    }

    constructor({
        numActivations = 10,
        threshold = 0.85,
        timeAfterStop = 800
    } = {}) {
        super()
        this.handler = handler.bind(this)
        this.type = "vad"
        this.event = "speakingStatus" //emitted
        this.hookableOnNodeTypes = ["mic", "downSampler", "speechPreemphaser"]
        this.options = {
            numActivations,
            threshold,
            timeAfterStop
        }
    }

    start(node) {
        this.wasmRuntime = new Rnnoise()
        this.bufferResidue = new Float32Array([])
        this.redemptionTimer = false
        this.activations = []
        this.speaking = false
        super.start(node)
    }

    stop() {
        if (this.hookedOn) {
            super.stop()
            this.wasmRuntime.destroy()
            delete this.wasmRuntime
        }
    }
}