import Node from '../nodes/node.js'
import Worker from '../workers/speechpreemphasis.blob.js'

const handler = function (nodeEvent) {
    this.workerRuntime.postMessage({
        method: "process",
        audioFrame: nodeEvent.detail
    })
}

export default class SpeechPreemphaser extends Node {
    constructor() {
        super()
        this.worker = Worker
        this.handler = handler
        this.type = "speechPreemphaser"
        this.event = "speechPreemphaserFrame" //emitted
        this.hookableOnNodeTypes = ["mic","downsampler"]
    }
}