import NodeError from '../nodes/error.js'

export default class Node extends EventTarget {
    constructor() {
        super()
    }

    hook(node) {
        if (this.hookedOn) return this
        if (!node && !this.type == "mic") throw new NodeError(`${this.type} argument for hook is an existing node`)
        if (node && !this.hookableNodeTypes.includes(node.type)) throw new NodeError(`${this.type} node cannot hook on ${node.type}`)
        if (this.worker) {
            this.worker.onmessage = (event) => {
                this.dispatchEvent(new CustomEvent(this.event, {
                    "detail": event.data
                }))
            }
        }
        return this
    }

    start() {
        if (!this.hookedOn) throw new NodeError(`This node is not hooked`)
        //forwards this.hookedOn.event to this.handler
        this.addEventListener(this.hookedOn.event, this.handler)
    }

    pause() {
        this.removeEventListener(this.hookedOn.event, this.handler)
    }

    destroy() {
        this.removeEventListener(this.hookedOn.event, this.handler)
    }
}