self.importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.7.0/dist/tf.min.js')
self.importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@3.7.0/dist/tf-backend-wasm.min.js') //.min.js not working when using SIMD/Threaded flags ?


let model
let hotWords
let threshold
onmessage = async function (msg) {
    switch (msg.data.method) {
        case "process":
            await tf.ready()
            infer(msg.data.features)
            break
        case "configure":
            threshold = msg.data.threshold
            await tf.wasm.setWasmPaths({
                'tfjs-backend-wasm.wasm': msg.data.wasmPaths.tfWasm,
                'tfjs-backend-wasm-simd.wasm': msg.data.wasmPaths.tfWasmSimd,
                'tfjs-backend-wasm-threaded-simd.wasm': msg.data.wasmPaths.tfWasmThreadedSimd,
            });
            //const simdSupported = await tf.env().getAsync('WASM_HAS_SIMD_SUPPORT')
            //const threadsSupported = await tf.env().getAsync('WASM_HAS_MULTITHREAD_SUPPORT')
            await tf.setBackend('wasm')
            break
        case "loadModel":
            await tf.enableProdMode()
            await tf.ready()
            hotWords = msg.data.words
            model = await tf.loadLayersModel(msg.data.modelUrl)
            break
    }
}


let noSpam = false
function infer(features) {
    if (!noSpam) {
        noSpam = !noSpam
        setTimeout(() => {
            noSpam = !noSpam
        }, 0) // Prevents for firying multiple hotword events. Even if hotword node is paused. This is ugly but necessary
        let tensor
        let inference
        let inferedArray
        tf.tidy((tensor) => {
            tensor = tf.tensor3d(new Array(features))
            inference = model.predict(tensor)
            inferedArray = Array.from(inference.dataSync())
            // 1st map Constructs array ["hotWordName":float(0->1)]
            // 2nd map Checks if any value > threshold
            tensor.dispose()
        })
        hotWords.map((hotWord, index) => {
            return [hotWord, inferedArray[index]]
        }).map((val) => {
            if (val[1] > threshold) {
                postMessage(val[0]) // name of the spotted hotword
            }
        })
    }

}