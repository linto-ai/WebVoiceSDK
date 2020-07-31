import webSpeech from '../src/web-speech-sdk/webspeech'

window.webSpeech = webSpeech

const defaultVADSettings = {
    numActivations: 10,
    threshold: 0.85,
    timeAfterStop: 800
}

const defaultMicSettings = {
    nativeSampleRate: 44100,
    nativeFrameSize: 4096,
    constraints: {
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true
    }
}

const defaultDownSamplerSettings = {
    audioFrameEvent: "nativeAudioFrame",
    targetSampleRate: 16000,
    targetFrameSize: 512,
    Int16Convert: false
}

const defaultSpeechPreEmphasisSettings = {
    audioFrameEvent: "downSampledAudioFrame"
}

const defaultFeatureExtractionSettings = {
    audioFrameEvent: "speechPreEmphasedAudioFrame",
    windowLength: 1024,
    windowStride: 512,
    numFilters: 20,
    numCoefs: 14,
    sampleRate: 16000,
    discardFirstBand: true
}


let rawBuffer = []
const audioFrameHandler = function (audioFrame) {
    for (const sample of audioFrame.detail) rawBuffer.push(sample)
}

const VADHandler = function (speaking) {
    speaking.detail ? (document.getElementById("VADLed").classList.add("led-red"), document.getElementById("VADLed").classList.remove("led-green")) : (document.getElementById("VADLed").classList.add("led-green"), document.getElementById("VADLed").classList.remove("led-red"))
}

// "downSampledAudioFrame", "nativeAudioFrame", "emphasedAudioFrame"
const startRec = function (eventFrame) {
    webSpeech.addEventListener(eventFrame, audioFrameHandler)
}

const stopRec = function (eventFrame, sampleRate) {
    let context = new AudioContext()
    //Creates an empty mono rawBuffer.length buffer
    let audioBuffer = context.createBuffer(1, rawBuffer.length, sampleRate)
    // fills audioBuffer
    audioBuffer.getChannelData(0).set(rawBuffer)
    let replaySource = context.createBufferSource()
    replaySource.buffer = audioBuffer;
    // Playback default
    replaySource.connect(context.destination);
    replaySource.start(0);
    //Cleans up
    webSpeech.removeEventListener(eventFrame, audioFrameHandler)
    rawBuffer = []
}

// HTML Interface
document.getElementById('mic').value = JSON.stringify(defaultMicSettings, false, 4)
document.getElementById('downsampler').value = JSON.stringify(defaultDownSamplerSettings, false, 4)
document.getElementById('VAD').value = JSON.stringify(defaultVADSettings, false, 4)
document.getElementById('speechPreEmphasis').value = JSON.stringify(defaultSpeechPreEmphasisSettings, false, 4)
document.getElementById('featureExtraction').value = JSON.stringify(defaultFeatureExtractionSettings, false, 4)

document.getElementById("start").onclick = async () => {
    await webSpeech.startMic(JSON.parse(document.getElementById('mic').value))
}
document.getElementById("stop").onclick = () => {
    return webSpeech.stopMic()
}
document.getElementById("useDownsampler").onchange = function () {
    this.checked ? webSpeech.hookDownSampler() : webSpeech.unHookDownSampler()
}
document.getElementById("useVAD").onchange = function () {
    if (webSpeech.mic.status == "online") {
        let VADSettings = JSON.parse(document.getElementById('VAD').value)
        document.getElementById("VADLed").setAttribute('style', 'display:inline-block;')
        this.checked ? (webSpeech.hookVAD(VADSettings), webSpeech.addEventListener("speaking", VADHandler)) : (webSpeech.unHookVAD(), webSpeech.removeEventListener("speaking", VADHandler))
    } else {
        document.getElementById("VADLed").setAttribute('style', 'display:none;')
        this.checked = false
    }
}