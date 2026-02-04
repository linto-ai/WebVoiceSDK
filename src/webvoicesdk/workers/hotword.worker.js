// Hotword detection worker using TensorFlow.js
// This worker uses ES modules - the user's bundler will handle TensorFlow

import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-wasm'

let model
let hotWords
let threshold

self.onmessage = async function (msg) {
    switch (msg.data.method) {
        case "process":
            await tf.ready()
            infer(msg.data.features)
            break
        case "configure":
            threshold = msg.data.threshold
            // TensorFlow WASM backend will auto-configure paths when using modern bundlers
            // The bundler copies WASM files and tf.wasm handles the rest
            await tf.setBackend('wasm')
            await tf.ready()
            break
        case "loadModel":
            await tf.enableProdMode()
            await tf.ready()
            hotWords = msg.data.words
            model = await tf.loadLayersModel(msg.data.modelUrl)
            self.postMessage({ type: 'modelLoaded' })
            break
    }
}

let noSpam = false
function infer(features) {
    if (!noSpam) {
        noSpam = !noSpam
        setTimeout(() => {
            noSpam = !noSpam
        }, 0) // Prevents firing multiple hotword events

        let tensor
        let inference
        let inferedArray

        tf.tidy(() => {
            tensor = tf.tensor3d(new Array(features))
            inference = model.predict(tensor)
            inferedArray = Array.from(inference.dataSync())
        })

        hotWords.map((hotWord, index) => {
            return [hotWord, inferedArray[index]]
        }).map((val) => {
            if (val[1] > threshold) {
                self.postMessage({ type: 'hotword', word: val[0] })
            }
        })
    }
}
