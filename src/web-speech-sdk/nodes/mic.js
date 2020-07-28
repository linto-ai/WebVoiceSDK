import Node from '../nodes/node.js'

export default class Mic extends Node {
    
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
        this.event = "micFrame" //emitted
        this.status = "offline"
        this.hookableNodeTypes = [] //none
        this.options = {
            sampleRate,
            frameSize,
            constraints
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
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream)
        this.micFrameGenerator = this.audioContext.createScriptProcessor(this.options.frameSize, 1, 1)
        this.hookedOn = "mediaDevices"
    }

    start() {
        if (this.status == "offline") {
            this.micFrameGenerator.onaudioprocess = (audioFrame) => {
                console.log("frame")
                const micFrame = audioFrame.inputBuffer.getChannelData(0)
                this.dispatchEvent(new CustomEvent(this.event, {
                    "detail": micFrame
                }))
            }
            this.mediaStreamSource.connect(this.micFrameGenerator)
            this.micFrameGenerator.connect(this.audioContext.destination)
            this.status = "online"
        }
        return this
    }

    pause(){
        this.mediaStreamSource.disconnect()
        this.micFrameGenerator.disconnect()
    }


}