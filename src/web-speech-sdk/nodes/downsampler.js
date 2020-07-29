import Node from '../nodes/node.js'
import Worker from '../workers/downsampler.blob.js'

const handler = function (nodeEvent) {
    this.workerRuntime.postMessage({
        method: "process",
        audioFrame: nodeEvent.detail
    })
}

export default class DownSampler extends Node {

    static defaultOptions = {
        targetSampleRate: 16000,
        targetFrameSize: 512,
        Int16Convert: false
    }

    constructor({
        targetSampleRate = 16000,
        targetFrameSize = 512,
        Int16Convert = false
    } = {}) {
        super()
        this.worker = Worker
        this.handler = handler.bind(this)
        this.type = "downSampler"
        this.event = "downSamplerFrame" //emitted
        this.hookableOnNodeTypes = ["mic"]
        this.options = {
            targetSampleRate,
            targetFrameSize,
            Int16Convert,
            sampleRate: targetSampleRate,
            frameSize: targetFrameSize
        }
    }

    async start(node) {
        await super.start(node)
        this.workerRuntime.postMessage({
            method: "configure",
            nativeSampleRate: node.options.sampleRate,
            ...this.options
        })
    }
}