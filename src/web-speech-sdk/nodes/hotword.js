import Node from '../nodes/node.js'
import Worker from '../workers/hotword.blob.js'
import NodeError from '../nodes/error.js'
//uses a specific parcel bundler plugin to get the blob URL of the backend wasm file
import tfWasm from '../../../node_modules/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm' 
// import all hotword models using a specific parcel bundler plugin
import models from "../../../hotwords/**/*.bin"

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

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
        this.availableModels = []
        for (let modelName in models){
            let weigthManifest = models[modelName]
            for (let callOnMe in weigthManifest){
                let modelURL = models[modelName][callOnMe]["blobModelPath"].call()
                this.availableModels.push({[modelName]:modelURL})
            }
        }
    }

    //Optional VAD node to infer only if vad.speaking==true
    async start(node,vadNode){
        await super.start(node)
        if (vadNode) this.vadNode = vadNode
        // Loads wasm backend on tensorflowJs
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

    loadModel(modelUrl){
        this.workerRuntime.postMessage({
            method: "loadModel",
            modelUrl
        })
    }


    test(){
        this.workerRuntime.postMessage({
            method: "test"
        })
    }
}