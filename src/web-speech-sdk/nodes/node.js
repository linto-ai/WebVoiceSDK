import NodeError from '../nodes/error.js'

export default class Node extends EventTarget {
    constructor() {
        super()
        this.hookedFrom = []
    }

    hook(node) {
        if (this.hookedOn) throw new NodeError(`node ${this.type} is already hooked on ${this.hookedOn}, call unhook first`)
        if (!node) {
            if (this.type != "mic") throw new NodeError(`${this.type} requires a node argument to hook on`)
        }
        if (node && !this.hookableNodeTypes.includes(node.type)) throw new NodeError(`${this.type} node cannot hook on ${node.type}`)
        // Emitter
        if (this.worker) {
            this.worker.onmessage = (event) => {
                this.dispatchEvent(new CustomEvent(this.event, {
                    "detail": event.data
                }))
            }
        }
        if (this.type != "mic") node.hookedFrom.push(this)
        return this
    }

    start() {
        if (!this.hookedOn) throw new NodeError(`This node is not hooked`)
        //forwards this.hookedOn.event to this.handler
        if (this.type != "mic") this.addEventListener(this.hookedOn.event, this.handler)
    }

    pause() {
        if (this.type != "mic") this.removeEventListener(this.hookedOn.event, this.handler)
    }

    unHook() {
        if (this.type != "mic") this.removeEventListener(this.hookedOn.event, this.handler)
        // this.hookedFrom.map((node) => {
        //     node.unHook()
        // }) //chain destruction
        if (this.worker) {
            this.worker.terminate()
            delete this.worker
        }
        this.hookedOn = null
    }
}