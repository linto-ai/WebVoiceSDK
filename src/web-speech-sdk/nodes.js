import DownSampler from './nodes/downsampler.js'
import Mic from './nodes/mic.js'

class WebSpeechSDK {
    static downSampler = new DownSampler(DownSampler.defaultOptions)
    static mic = new Mic(Mic.defaultOptions)
}

window.WebSpeechSDK = WebSpeechSDK
