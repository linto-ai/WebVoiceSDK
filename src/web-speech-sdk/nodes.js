import DownSampler from './nodes/downsampler.js'
import Mic from './nodes/mic.js'
import SpeechPreemphaser from './nodes/speechpreemphasis.js'

window.mic = new Mic(Mic.defaultOptions)
window.downSampler = new DownSampler(DownSampler.defaultOptions)
window.s = new SpeechPreemphaser()
