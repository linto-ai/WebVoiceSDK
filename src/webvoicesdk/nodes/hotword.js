import Node from '../nodes/node.js'
import Worker from '../workers/hotword.blob.js'
//uses a specific parcel bundler plugin to get the blob URL of the backend wasm file
import tfWasmThreadedSimd from '../../../node_modules/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm'
import tfWasmSimd from '../../../node_modules/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm'
import tfWasm from '../../../node_modules/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm'
// import all hotword models using a specific parcel bundler plugin
import models from "../../../hotwords/**/*.bin"

const handler = function (mfcc) {
    if (this.mfccBuffer.length < this.mfccBufferSize) {
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
        this.availableModels = {}
        for (let modelName in models) {
            let weigthManifest = models[modelName]
            for (let callOnMe in weigthManifest) {
                let modelURL = models[modelName][callOnMe]["blobModelPath"].call()
                this.availableModels[modelName] = modelURL
            }
        }
    }

    //Optional VAD node to infer only if vad.speaking==true
    async start(node, vadNode, threshold = 0.8) {
        await super.start(node)
        if (vadNode) this.vadNode = vadNode
        // Loads wasm backend on tensorflowJs
        this.workerRuntime.postMessage({
            method: "configure",
            threshold,
            wasmPaths: {
                tfWasm: tfWasm.forInstanciate(),
                tfWasmSimd: tfWasmSimd.forInstanciate(),
                tfWasmThreadedSimd: tfWasmThreadedSimd.forInstanciate()
            }
        })
    }

    pause() {
        super.pause()
        this.mfccBuffer = [] // Clears already processed buffer
    }

    stop() {
        if (this.hookedOn) {
            super.stop()
        }
    }

    async loadModel(modelUrl) {
        //fetches the model manifest
        const manifestRequest = await fetch(modelUrl, {
            method: 'GET'
        })
        const manifest = await manifestRequest.json()
        // Sets number of MFCC frames
        this.mfccBufferSize = manifest.modelTopology.model_config.config.layers[0].config.batch_input_shape[1]
        this.workerRuntime.postMessage({
            method: "loadModel",
            modelUrl,
            words:manifest.words
        })
        return Promise.resolve()
    }
}