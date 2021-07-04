export default class NodeError extends Error {
    constructor(error) {
        super(error)
        this.name = 'WEBVOICESDK_NODE_ERROR';
        this.error = error
    }
}