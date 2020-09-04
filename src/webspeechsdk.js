import Mic from './web-speech-sdk/nodes/mic.js'
import Recorder from './web-speech-sdk/nodes/recorder.js'
import Vad from './web-speech-sdk/nodes/vad.js'
import DownSampler from './web-speech-sdk/nodes/downsampler.js'
import SpeechPreemphaser from './web-speech-sdk/nodes/speechpreemphasis.js'
import FeaturesExtractor from './web-speech-sdk/nodes/features.js'
import Hotword from './web-speech-sdk/nodes/hotword.js'

const webSpeechSDK = {
    DownSampler,
    Mic,
    SpeechPreemphaser,
    Vad,
    FeaturesExtractor,
    Hotword,
    Recorder
}

window.webSpeechSDK = webSpeechSDK
module.exports = webSpeechSDK