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
window.rec = new Recorder()
window.start = async function(){
    // await downSampler.start(mic)
    // await speechPreemphaser.start(downSampler)
    // await vad.start(mic)
    // await feat.start(speechPreemphaser)
    // //Optionnal VAD node... infer hotword only if needed
    // await hotword.start(feat)
    // await hotword.loadModel()
    // await mic.start()
}
