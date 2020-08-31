import webSpeechSDK from '../../src/webspeechsdk.js'

const VADHandler = function (speakingEvent) {
    speakingEvent.detail ? (document.getElementById("VADLed").classList.add("led-red"), document.getElementById("VADLed").classList.remove("led-green")) : (document.getElementById("VADLed").classList.add("led-green"), document.getElementById("VADLed").classList.remove("led-red"))
}

const HotwordHandler = function (hotwordEvent) {
    hotwordEvent.detail.map((val)=>{
        if (val[1] > 0.7){
            hotword.pause()
            hotword.removeEventListener("hotword", HotwordHandler)
            document.getElementById("LinTO").innerHTML = val[0]
            document.getElementById("LinTO").setAttribute('style', 'display:inline-block;')
        }
    })
    setTimeout(() => {
        document.getElementById("LinTO").setAttribute('style', 'display:none;')
        hotword.resume()
        hotword.addEventListener("hotword", HotwordHandler)
    }, 1500)
}
window.start = async function () {
    window.mic = new webSpeechSDK.Mic(JSON.parse(document.getElementById('mic').value))
    window.downSampler = new webSpeechSDK.DownSampler(JSON.parse(document.getElementById('downsampler').value))
    window.vad = new webSpeechSDK.Vad(JSON.parse(document.getElementById('VAD').value))
    window.speechPreemphaser = new webSpeechSDK.SpeechPreemphaser()
    window.feat = new webSpeechSDK.FeaturesExtractor()
    window.hotword = new webSpeechSDK.Hotword()
    await downSampler.start(mic)
    await vad.start(mic)
    await speechPreemphaser.start(downSampler)
    await feat.start(speechPreemphaser)
    await hotword.start(feat, vad)
    await hotword.loadModel(hotword.availableModels["slinfox"])
    await mic.start()
    document.getElementById("VADLed").setAttribute('style', 'display:inline-block;')
    vad.addEventListener("speakingStatus", VADHandler)
    hotword.addEventListener("hotword", HotwordHandler)
}

window.stop = async function () {
    await downSampler.stop()
    await vad.stop()
    await speechPreemphaser.stop()
    await feat.stop()
    await hotword.stop(feat, vad)
    document.getElementById("VADLed").setAttribute('style', 'display:none;')
    vad.removeEventListener("speakingStatus", VADHandler)
}

window.rec = async function () {
    window.recMic = new webSpeechSDK.Recorder()
    window.recFeatures = new webSpeechSDK.Recorder()
    window.recDownsampler = new webSpeechSDK.Recorder()
    window.recSpeechPreemphaser = new webSpeechSDK.Recorder()
    window.recHw = new webSpeechSDK.Recorder()
    await recMic.start(mic)
    await recHw.start(hotword)
    await recFeatures.start(feat)
    await recDownsampler.start(downSampler)
    await recSpeechPreemphaser.start(speechPreemphaser)
    recMic.rec()
    recFeatures.rec()
    recDownsampler.rec()
    recSpeechPreemphaser.rec()
    recHw.rec()
}

window.stopRec = async function () {
    recMic.stopRec()
    recFeatures.stopRec()
    recDownsampler.stopRec()
    recSpeechPreemphaser.stopRec()
    recHw.stopRec()

    recMic.getFile()
    recFeatures.getFile()
    recDownsampler.getFile()
    recSpeechPreemphaser.getFile()
    recHw.getFile()
}




// HTML Interface
document.getElementById('mic').value = JSON.stringify(webSpeechSDK.Mic.defaultOptions, false, 4)
document.getElementById('downsampler').value = JSON.stringify(webSpeechSDK.DownSampler.defaultOptions, false, 4)
document.getElementById('VAD').value = JSON.stringify(webSpeechSDK.Vad.defaultOptions, false, 4)


document.getElementById("start").onclick = async () => {
    start()
}

document.getElementById("stop").onclick = async () => {
    stop()
}

document.getElementById("startrecord").onclick = async () => {
    rec()
}

document.getElementById("stoprecord").onclick = async () => {
    stopRec()
}