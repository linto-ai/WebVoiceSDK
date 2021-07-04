import NodeError from '../nodes/error.js'

export default class Node extends EventTarget {
    constructor() {
        super()
        this.status = "non-emitting"
    }

    async start(node) {
        if (this.hookedOn) throw new NodeError(`node ${this.type} is already hooked on ${this.hookedOn}, call stop() first`)
        if (!node) throw new NodeError(`${this.type} requires a node argument to hook on`)
        if (node && !this.hookableOnNodeTypes.includes(node.type)) throw new NodeError(`${this.type} node cannot hook on ${node.type}`)
        this.startWorker()
        this.hookedOn = node
        this.resume()
    }

    startWorker() {
        if (this.worker) {
            this.workerRuntime = this.worker.init()
            this.workerRuntime.onmessage = (event) => {
                this.dispatchEvent(new CustomEvent(this.event, {
                    "detail": event.data
                }))
            }
        }
    }

    stop() {
        this.pause()
        if (this.workerRuntime) {
            this.workerRuntime.terminate()
            delete this.workerRuntime
        }
        this.hookedOn = null
    }

    pause() {
        if (this.hookedOn && this.status == "emitting") {
            if (this.type != "mic") this.hookedOn.removeEventListener(this.hookedOn.event, this.handler)
            this.status = "non-emitting"
        }
    }

    resume() {
        // force this.handler to bind on "this" instead of default addEventListener target (this.hookedOn)
        if (this.hookedOn && this.status == "non-emitting") {
            if (this.type != "mic") this.hookedOn.addEventListener(this.hookedOn.event, this.handler)
            this.status = "emitting"
        }
    }


}