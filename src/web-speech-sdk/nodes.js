import DownSampler from './nodes/downsampler.js'
import Mic from './nodes/mic.js'
import SpeechPreemphaser from './nodes/speechpreemphasis.js'
import Vad from './nodes/vad.js'
import FeaturesExtractor from './nodes/features.js'
import Hotword from './nodes/hotword.js'
import Recorder from './nodes/recorder.js'


window.mic = new Mic(Mic.defaultOptions)
window.downSampler = new DownSampler(DownSampler.defaultOptions)
window.speechPreemphaser = new SpeechPreemphaser()
window.vad = new Vad()
window.feat = new FeaturesExtractor()
window.hotword = new Hotword()

window.recMic = new Recorder()
window.recFeatures = new Recorder()
window.recDownsampler = new Recorder()
window.recSpeechPreemphaser = new Recorder()
window.recHw = new Recorder()


window.start = async function(){
    await downSampler.start(mic)
    await vad.start(mic)
    await speechPreemphaser.start(downSampler)
    await feat.start(speechPreemphaser)
    await hotword.start(feat)
    await hotword.loadModel(hotword.availableModels[1].lintoBeta)
    await mic.start()

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

window.stop = async function(){
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
