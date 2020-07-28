import Node from '../nodes/node.js'

export default class Mic extends Node {
    static defaultOptions = {
        sampleRate: 44100,
        frameSize: 4096,
        constraints: {
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true
        }
    }

    constructor({
        sampleRate = 44100,
        frameSize = 4096,
        constraints = {
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true
        }
    } = {}) {
        super()
        this.type = "mic"
        this.status = "not-emitting"
        this.event = "micFrame" //emitted
        this.hookedOn = null
        this.hookableNodeTypes = [] //none, this node will connect to getUserMedia stream
        this.options = {
            sampleRate,
            frameSize,
            ...constraints
        }
    }

    async hook() {
        super.hook()
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: this.options.sampleRate,
                channelCount: 1,
                ...this.options.constraints
            },
        })
        this.audioContext = new(window.AudioContext || window.webkitAudioContext)({
            sampleRate: this.options.sampleRate,
        })
        this.hookedOn = "mediaDevices"
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream)
        this.micFrameGenerator = this.audioContext.createScriptProcessor(this.options.frameSize, 1, 1)
        return this
    }

    start() {
        if (this.status == "not-emitting" && (this.hookedOn == "mediaDevices")) {
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
        return this
    }


    pause() {
        if (this.status == "emitting" && this.hookedOn == "mediaDevices") {
            this.mediaStreamSource.disconnect()
            this.micFrameGenerator.disconnect()
            this.status = "not-emitting"
        }
        return this
    }

    unHook() {
        if (this.hookedOn == "mediaDevices") {
            super.unHook()
            this.stream.getTracks().map((track) => {
                return track.readyState === 'live' && track.kind === 'audio' ? track.stop() : false
            })
            this.pause()
            delete this.mediaStreamSource
            delete this.micFrameGenerator
            this.audioContext.close().then(() => {
                delete this.stream
                delete this.audioContext
                this.status = "not-emitting"
                this.hookedOn = null
            })

        }
        return this
    }
}