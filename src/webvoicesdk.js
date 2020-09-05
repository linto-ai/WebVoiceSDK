import Mic from './webvoicesdk/nodes/mic.js'
import Recorder from './webvoicesdk/nodes/recorder.js'
import Vad from './webvoicesdk/nodes/vad.js'
import DownSampler from './webvoicesdk/nodes/downsampler.js'
import SpeechPreemphaser from './webvoicesdk/nodes/speechpreemphasis.js'
import FeaturesExtractor from './webvoicesdk/nodes/features.js'
import Hotword from './webvoicesdk/nodes/hotword.js'

const webVoiceSDK = {
    DownSampler,
    Mic,
    SpeechPreemphaser,
    Vad,
    FeaturesExtractor,
    Hotword,
    Recorder
}

window.webVoiceSDK = webVoiceSDK
module.exports = webVoiceSDK