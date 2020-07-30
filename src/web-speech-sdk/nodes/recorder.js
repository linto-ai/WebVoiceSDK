import Node from '../nodes/node.js'

const handler = function (nodeEvent) {
    if (this.recOn){
        for (const sample of nodeEvent.detail) this.rawBuffer.push(sample)
    }
}

export default class recorder extends Node {
    constructor() {
        super()
        this.handler = handler.bind(this)
        this.type = "recorder"
        this.event = "recorder" //emitted
        this.recOn = false
        this.hookableOnNodeTypes = ["mic","downSampler","speechPreemphaser"]
    }

    async start(node){
        this.rawBuffer = []
        await super.start(node)
        this.context = new AudioContext()
    }


    rec(){
        if (!this.recOn) this.recOn = true
    }

    stopRec(){
        if (this.recOn) this.recOn = false
        this.audioBuffer = this.context.createBuffer(1, this.rawBuffer.length, this.hookedOn.options.sampleRate)
        this.audioBuffer.getChannelData(0).set(this.rawBuffer)
    }

    clean(){
        this.rawBuffer = []
    }

    play(){
        let replaySource = this.context.createBufferSource()
        replaySource.buffer = this.audioBuffer
        // Playback default
        replaySource.connect(this.context.destination)
        replaySource.start(0)
    }
}