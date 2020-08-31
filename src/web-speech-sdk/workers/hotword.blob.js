self.importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.3.0/dist/tf.min.js')
self.importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@2.3.0/dist/tf-backend-wasm.min.js')

let model
let hotWords
onmessage = async function (msg) {
    switch (msg.data.method) {
        case "process":
            await tf.ready()
            infer(msg.data.features)
            break
        case "configure":
            await tf.wasm.setWasmPath(msg.data.wasmPath)
            await tf.setBackend('wasm')
            break
        case "loadModel":
            await tf.ready()
            const manifestRequest = await fetch(msg.data.modelUrl, {method: 'GET'})
            const manifestResponse = await manifestRequest.json()
            hotWords = manifestResponse.words
            model = await tf.loadLayersModel(msg.data.modelUrl)
            break
    }
}

let tensor
function infer(features) {
    tensor = tf.tensor3d(new Array(features))
    const inference = model.predict(tensor)
    const value = Array.from(inference.dataSync())
    const infered = hotWords.map((val,index)=>{
        return [val, value[index]]
    })
    postMessage(infered)
}