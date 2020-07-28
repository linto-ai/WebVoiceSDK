import Node from '../nodes/node.js'
import Worker from '../workers/downsampler.blob.js'

const handler = function (nodeEvent) {
    this.downSampler.postMessage({
        method: "process",
        audioFrame: nodeEvent.detail
    })
}

export default class DownSampler extends Node {
    constructor({
        targetSampleRate = 16000,
        targetFrameSize = 512,
        Int16Convert = false
    } = {}) {
        super()
        this.type = "downSampler"
        this.event = "downSamplerFrame" //emitted
        this.hookableNodeTypes = ["mic"]
        this.worker = Worker.init()
        this.handler = handler
        this.options = {
            targetSampleRate,
            targetFrameSize,
            Int16Convert
        }
    }

    hook(node){
        super.hook(node)
        this.hookedOn = node
        this.worker.postMessage({
            method: "configure",
            nativeSampleRate: node.options.sampleRate,
            ...this.options
        })
        return this
    }
}
