import DownSampler from './nodes/downsampler.js'
import Mic from './nodes/mic.js'

class WebSpeechSDK {
    static downSampler = new DownSampler()
    static mic = new Mic()
}

window.WebSpeechSDK = WebSpeechSDK
