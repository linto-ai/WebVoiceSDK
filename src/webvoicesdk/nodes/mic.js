import Node from '../nodes/node.js'
import NodeError from '../nodes/error.js'

export default class Mic extends Node {
    static defaultOptions = {
        //sampleRate: 44100, 
        frameSize: 4096,
        constraints: {
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true
        }
    }

    constructor({
        //sampleRate = 44100,
        frameSize = 4096,
        constraints = {
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true
        }
    } = {}) {
        super()
        // For cross-browser compat, i will now use only default sampleRate.
        // I instanciante a Dummy AudioContext to fetch the browser / OS / Device default value
        //@TODO : CLEAN THIS DIRTY HACK. Quite complicated though...
        this.hookableOnNodeTypes = [] //none, this node will connect to getUserMedia stream
        let DummyAudioContext = window.AudioContext || window.webkitAudioContext
        let dummyAudioCtx = new DummyAudioContext()
        this.type = "mic"
        this.event = "micFrame" //emitted
        this.hookedOn = null
        this.options = {
            sampleRate: dummyAudioCtx.sampleRate,
            frameSize,
            constraints
        }
        dummyAudioCtx.close()
    }

    async start() {
        if (this.hookedOn) throw new NodeError(`node ${this.type} is already hooked, call stop() first`)
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: this.options.sampleRate,
                channelCount: 1,
                ...this.options.constraints
            },
        })
        this.hookedOn = true

        this.audioContext = new(window.AudioContext || window.webkitAudioContext)({
            sampleRate: this.options.sampleRate,
        })
        this.options.sampleRate = this.audioContext.sampleRate
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream)
        this.micFrameGenerator = this.audioContext.createScriptProcessor(this.options.frameSize, 1, 1)
        if (this.status == "non-emitting" && this.hookedOn) {
            this.micFrameGenerator.onaudioprocess = (audioFrame) => {
                const micFrame = audioFrame.inputBuffer.getChannelData(0)
                this.dispatchEvent(new CustomEvent(this.event, {
                    "detail": micFrame
                }))
            }
            this.mediaStreamSource.connect(this.micFrameGenerator)
            this.micFrameGenerator.connect(this.audioContext.destination)
            this.status = "emitting"
        }
        return Promise.resolve()
    }

    resume() {
        super.resume()
        this.mediaStreamSource.connect(this.micFrameGenerator)
        this.micFrameGenerator.connect(this.audioContext.destination)
    }


    pause() {
        super.pause()
        this.mediaStreamSource.disconnect()
        this.micFrameGenerator.disconnect()
    }

    stop() {
        if (this.hookedOn) {
            this.stream.getTracks().map((track) => {
                return track.readyState === 'live' && track.kind === 'audio' ? track.stop() : false
            })
            this.pause()
            delete this.mediaStreamSource
            delete this.micFrameGenerator
            this.audioContext.close().then(() => {
                delete this.stream
                delete this.audioContext
            })
            this.hookedOn = null
        }
    }
}