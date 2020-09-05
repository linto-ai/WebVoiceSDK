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
            const manifestRequest = await fetch(msg.data.modelUrl, {
                method: 'GET'
            })
            const manifestResponse = await manifestRequest.json()
            hotWords = manifestResponse.words
            model = await tf.loadLayersModel(msg.data.modelUrl)
            break
    }
}

let tensor
let noSpam = false
function infer(features) {
    if (!noSpam) {
        noSpam = !noSpam
        setTimeout(() => {
            noSpam = !noSpam
        }, 0) // Prevents for firying multiple hotword events. Even if hotword node is paused. This is ugly but necessary
        tensor = tf.tensor3d(new Array(features))
        const inference = model.predict(tensor)
        const inferedArray = Array.from(inference.dataSync())
        // 1st map Constructs array ["hotWordName":float(0->1)]
        // 2nd map Checks if any value > 0.8 (threshold)
        hotWords.map((hotWord, index) => {
            return [hotWord, inferedArray[index]]
        }).map((val) => {
            if (val[1] > 0.8) {
                postMessage(val[0]) // name of the spotted hotword
            }
        })
    }

}