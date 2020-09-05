import Node from '../nodes/node.js'
import Worker from '../workers/features.blob.js'
import NodeError from '../nodes/error.js'

const handler = function (nodeEvent) {
    if (this.status == "non-emitting") return
    //accumulate audioframes until analysis window is full
    if (this.windowBuffer.length == this.windowLength) {
        this.workerRuntime.postMessage({
            method: "process",
            audioFrame: Float32Array.from(this.windowBuffer)
        })
        // slide by windowStride
        this.windowBuffer = this.windowBuffer.slice(-this.windowStride)
    }
    this.windowBuffer = [...this.windowBuffer, ...nodeEvent.detail]
}


export default class FeaturesExtractor extends Node {

    static defaultOptions = {
        numFilters: 20,
        numCoefs: 14,
        discardFirstBand: true
    }

    constructor({
        numFilters = 20,
        numCoefs = 14,
        discardFirstBand = true
    } = {}) {
        super()
        this.worker = Worker
        this.handler = handler.bind(this)
        this.type = "featuresExtractor"
        this.event = "mfccFeatures" //emitted
        this.hookableOnNodeTypes = ["mic", "downSampler", "speechPreemphaser"]
        this.windowBuffer = new Array()
        this.options = {
            numFilters,
            numCoefs,
            discardFirstBand
        }
    }

    async start(node) {
        if (!node) throw new NodeError(`${this.type} requires a node argument to hook on`)
        try {
            this.options = {
                ...this.options,
                sampleRate: node.options.sampleRate,
                frameSize: node.options.frameSize
            }
            await super.start(node)
            this.windowStride = node.options.frameSize
            this.windowLength = node.options.frameSize * 2
            this.workerRuntime.postMessage({
                method: "configure",
                bufferSize: this.windowLength,
                ...this.options
            })
        } catch (e) {
            throw new NodeError(`${node.type} needs to get started before being passed to ${this.type}.start()`)
        }

    }
}