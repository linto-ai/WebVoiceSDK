import downSamplerInline from './workers-inline/downsampler.worker.js'
import speechPreEmphasisInline from './workers-inline/speechpreemphasis.worker.js'
import featureExtractorInline from './workers-inline/features.worker.js'
import hotwordInline from './workers-inline/hotword.worker.js'

import {
    Rnnoise
} from './rnnoise-inline/index.js'

import {
    hotWordHandler,
    downSamplerHandler,
    speechPreEmphasisHandler,
    vadOnAudioProcessHandler,
    featureExtractorHandler
} from './webspeech/handlers'

class WebSpeech extends EventTarget {
    constructor() {
        super()
        this.mic = {
            status: "offline"
        }
    }

    hookDownSampler({
        audioFrameEvent = "nativeAudioFrame",
        targetSampleRate = 16000,
        targetFrameSize = 512,
        Int16Convert = false
    } = {}) {
        if (!this.downSampler && this.mic.status == "online") {
            this.downSampler = downSamplerInline.init()
            this.downSampler.postMessage({
                method: "configure",
                nativeSampleRate: this.mic.mediaStreamSource.context.sampleRate,
                targetSampleRate,
                targetFrameSize,
                Int16Convert
            })
            //offloads work to this.downSampler
            this.addEventListener("nativeAudioFrame", downSamplerHandler)
            this.downSampler.onmessage = (audioFrame) => {
                this.dispatchEvent(new CustomEvent("downSampledAudioFrame", {
                    "detail": audioFrame.data
                }))
            }
            this.downSampler.options = {
                audioFrameEvent,
                targetSampleRate,
                targetFrameSize,
                Int16Convert
            }
        }
    }

    unHookDownSampler() {
        if (this.downSampler) {
            this.removeEventListener(this.downSampler.options.audioFrameEvent, downSamplerHandler)
            this.downSampler.terminate()
            delete this.downSampler
        }
    }

    hookFeatureExtrator({
        audioFrameEvent = "speechPreEmphasedAudioFrame",
        windowLength = 1024,
        windowStride = 512,
        numFilters = 20,
        numCoefs = 14,
        sampleRate = 16000,
        discardFirstBand = true
    } = {}) {
        if (!this.featureExtractor && this.mic.status == "online") {
            this.featureExtractor = featureExtractorInline.init()
            //offloads work to this.featureExtractor
            this.featureExtractor.postMessage({
                method: "configure",
                numFilters,
                numCoefs,
                sampleRate,
                bufferSize: windowLength,
                discardFirstBand
            })
            this.featureExtractor.windowBuffer = []
            this.addEventListener(audioFrameEvent, featureExtractorHandler)
            this.featureExtractor.onmessage = (mfcc) => {
                this.dispatchEvent(new CustomEvent("mfcc", {
                    "detail": mfcc
                }))
            }
            this.featureExtractor.options = {
                audioFrameEvent,
                numFilters,
                numCoefs,
                sampleRate,
                windowLength,
                windowStride,
                discardFirstBand
            }
        }
    }

    unHookFeatureExtrator() {
        if (this.featureExtractor) {
            this.removeEventListener(this.featureExtractor.options.audioFrameEvent, downSamplerHandler)
            this.featureExtractor.terminate()
            delete this.featureExtractor
        }
    }

    hookHotWord() {
        if (!this.hotWord) {
            this.hotWord = hotwordInline.init()
            this.hotWord.mfccBuffer = [] // when ready --> infer
            this.hotWord.postMessage({
                method: "configure"
            })
            this.addEventListener("mfcc", hotWordHandler)
        }
    }

    hookSpeechPreEmphaser({
        audioFrameEvent = "downSampledAudioFrame"
    } = {}) {
        if (!this.speechPreEmphaser && this.mic.status == "online") {
            this.speechPreEmphaser = speechPreEmphasisInline.init()
            this.addEventListener(audioFrameEvent, speechPreEmphasisHandler)
            this.speechPreEmphaser.onmessage = (audioFrame) => {
                this.dispatchEvent(new CustomEvent("speechPreEmphasedAudioFrame", {
                    "detail": audioFrame.data
                }))
            }
            this.speechPreEmphaser.options = {
                audioFrameEvent,
            }
        }
    }
    unHookSpeechPreEmphaser() {
        if (this.speechPreEmphaser) {
            this.removeEventListener(this.speechPreEmphaser.options.audioFrameEvent, speechPreEmphasisHandler)
            this.speechPreEmphaser.terminate()
            delete this.speechPreEmphaser
        }
    }

    hookVAD({
        numActivations = 10,
        threshold = 0.85,
        timeAfterStop = 800
    } = {}) {
        if (!this.VAD && this.mic.status == "online") {
            this.VAD = new Rnnoise()
            this.VAD.activations = []
            this.VAD.threshold = threshold
            this.VAD.numActivations = numActivations
            this.VAD.timeAfterStop = timeAfterStop
            this.VAD.redemptionTimer = true
            this.VAD.speaking = false
            this.VAD.bufferResidue = new Float32Array([])
            this.mic.vadProcessingNode = this.mic.audioContext.createScriptProcessor(this.mic.options.nativeFrameSize)
            this.mic.vadProcessingNode.onaudioprocess = vadOnAudioProcessHandler.bind(this)
            this.mic.mediaStreamSource.connect(this.mic.vadProcessingNode)
            this.mic.vadProcessingNode.connect(this.mic.audioContext.destination)
            this.VAD.options = {
                numActivations,
                threshold,
                timeAfterStop
            }
        }
    }

    unHookVAD() {
        this.mic.mediaStreamSource.disconnect(this.mic.vadProcessingNode)
        this.mic.vadProcessingNode.disconnect(this.mic.audioContext.destination)
        delete this.mic.vadProcessingNode
        this.VAD.destroy()
        delete this.VAD
    }

    async startMic({
        nativeSampleRate = 44100,
        nativeFrameSize = 4096,
        constraints = {
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true
        }
    } = {}) {
        if (this.mic.status == "offline") {
            this.mic.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: nativeSampleRate,
                    channelCount: 1,
                    ...constraints
                },
            })
            this.mic.audioContext = new(window.AudioContext || window.webkitAudioContext)({
                sampleRate: nativeSampleRate
            })
            this.mic.mediaStreamSource = this.mic.audioContext.createMediaStreamSource(this.mic.stream)
            this.mic.nativeAudioFrameGenerator = this.mic.audioContext.createScriptProcessor(nativeFrameSize, 1, 1)
            this.mic.nativeAudioFrameGenerator.onaudioprocess = (audioFrame) => {
                const nativeAudioFrame = audioFrame.inputBuffer.getChannelData(0)
                this.dispatchEvent(new CustomEvent("nativeAudioFrame", {
                    "detail": nativeAudioFrame
                }))
            }
            this.mic.mediaStreamSource.connect(this.mic.nativeAudioFrameGenerator)
            this.mic.nativeAudioFrameGenerator.connect(this.mic.audioContext.destination)
            this.mic.status = "online"
            this.mic.options = {
                nativeFrameSize,
                nativeSampleRate,
                constraints
            }
        }
    }

    async stopMic() {
        if (this.mic.status == "online") {
            if (this.downSampler) this.unHookDownSampler()
            if (this.speechPreEmphaser) this.unHookSpeechPreEmphaser()
            if (this.VAD) this.unHookVAD()
            if (this.featureExtractor) this.unHookFeatureExtrator()
            this.mic.stream.getTracks().map((track) => {
                return track.readyState === 'live' && track.kind === 'audio' ? track.stop() : false
            })
            this.mic.mediaStreamSource.disconnect(this.mic.nativeAudioFrameGenerator)
            this.mic.nativeAudioFrameGenerator.disconnect(this.mic.audioContext.destination)
            await this.mic.audioContext.close()
            delete this.mic
            this.mic = {
                status: "offline"
            }
        }
    }
}
export default new WebSpeech()