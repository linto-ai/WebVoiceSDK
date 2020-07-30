import Node from '../nodes/node.js'
import Worker from '../workers/hotword.blob.js'
import tfWasm from '../../../node_modules/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm'
//Hotword model bundling
import * as lintoModelWeights from "../../../hotwords/linto/2/group1-shard1of1.bin"

const handler = function (mfcc) {
    if (this.mfccBuffer.length < 30) {
        this.mfccBuffer.push(mfcc.detail)
    } else {
        this.mfccBuffer.shift()
        this.mfccBuffer.push(mfcc.detail)
        if (this.vadNode && !this.vadNode.speaking) return
        this.workerRuntime.postMessage({
            method: "process",
            features: this.mfccBuffer
        })
    }
}

export default class HotWord extends Node {
    constructor() {
        super()
        this.worker = Worker
        this.mfccBuffer = [] // buffer to infer when filled with 30 mfcc. See handler
        this.handler = handler.bind(this)
        this.type = "hotword"
        this.event = "hotword" //emitted
        this.hookableOnNodeTypes = ["featuresExtractor"]
    }

    //Optional VAD node to infer only if speaking is 
    async start(node,vadNode){
        await super.start(node)
        if (vadNode) this.vadNode = vadNode
        this.workerRuntime.postMessage({
            method: "configure",
            wasmPath: tfWasm.forInstanciate()
        })
    }

    stop() {
        if (this.hookedOn) {
            super.stop()
        }
    }

    loadModel(){
        let topology = require("../../../hotwords/linto/2/model.json")
        topology.weightsManifest[0].paths = [lintoModelWeights.weightsURL()]
        this.workerRuntime.postMessage({
            method: "loadModel",
            topology
        })
    }

    test(){
        this.workerRuntime.postMessage({
            method: "test"
        })
    }
}