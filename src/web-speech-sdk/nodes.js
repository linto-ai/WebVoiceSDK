import DownSampler from './nodes/downsampler.js'
import Mic from './nodes/mic.js'
import SpeechPreemphaser from './nodes/speechpreemphasis.js'
import Vad from './nodes/vad.js'
import FeatureExtractor from './nodes/features.js'


window.mic = new Mic(Mic.defaultOptions)
window.downSampler = new DownSampler(DownSampler.defaultOptions)
window.SpeechPreemphaser = new SpeechPreemphaser()
window.vad = new Vad()
window.feat = new FeatureExtractor()