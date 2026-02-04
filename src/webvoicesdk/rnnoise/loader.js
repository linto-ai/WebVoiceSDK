// Modern ES module loader for rnnoise WASM
// Replaces the old Emscripten-based loader with a cleaner implementation

const WASM_PAGE_SIZE = 65536
const INITIAL_MEMORY = 16777216

// WASM URL using import.meta.url for proper bundler support
const wasmUrl = new URL('../../vendor/rnnoise-wasm/dist/rnnoise.wasm', import.meta.url)

export default async function createRnnoiseModule() {
    const Module = {}

    // Create WebAssembly memory
    const wasmMemory = new WebAssembly.Memory({
        initial: INITIAL_MEMORY / WASM_PAGE_SIZE,
        maximum: 2147483648 / WASM_PAGE_SIZE
    })

    let buffer = wasmMemory.buffer

    // Create typed array views of memory
    function updateMemoryViews() {
        buffer = wasmMemory.buffer
        Module.HEAP8 = new Int8Array(buffer)
        Module.HEAP16 = new Int16Array(buffer)
        Module.HEAP32 = new Int32Array(buffer)
        Module.HEAPU8 = new Uint8Array(buffer)
        Module.HEAPU16 = new Uint16Array(buffer)
        Module.HEAPU32 = new Uint32Array(buffer)
        Module.HEAPF32 = new Float32Array(buffer)
        Module.HEAPF64 = new Float64Array(buffer)
    }

    updateMemoryViews()

    // WebAssembly table for function pointers
    const wasmTable = new WebAssembly.Table({
        initial: 1,
        maximum: 1,
        element: 'anyfunc'
    })

    // Emscripten runtime functions
    function emscripten_memcpy_big(dest, src, num) {
        Module.HEAPU8.copyWithin(dest, src, src + num)
    }

    function emscripten_resize_heap(requestedSize) {
        requestedSize = requestedSize >>> 0
        const oldSize = Module.HEAPU8.length
        const maxHeapSize = 2147483648

        if (requestedSize > maxHeapSize) {
            return false
        }

        for (let cutDown = 1; cutDown <= 4; cutDown *= 2) {
            let overGrownHeapSize = oldSize * (1 + 0.2 / cutDown)
            overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296)

            const newSize = Math.min(
                maxHeapSize,
                alignUp(Math.max(16777216, requestedSize, overGrownHeapSize), WASM_PAGE_SIZE)
            )

            try {
                wasmMemory.grow((newSize - buffer.byteLength + 65535) >>> 16)
                updateMemoryViews()
                return true
            } catch (e) {
                // Continue to next iteration
            }
        }
        return false
    }

    function alignUp(x, multiple) {
        if (x % multiple > 0) {
            x += multiple - (x % multiple)
        }
        return x
    }

    // Import object for WASM
    const importObject = {
        a: {
            a: emscripten_memcpy_big,
            b: emscripten_resize_heap,
            memory: wasmMemory,
            table: wasmTable
        }
    }

    // Load and instantiate WASM
    let wasmInstance
    try {
        const response = await fetch(wasmUrl)
        const result = await WebAssembly.instantiateStreaming(response, importObject)
        wasmInstance = result.instance
    } catch (e) {
        // Fallback for environments that don't support instantiateStreaming
        const response = await fetch(wasmUrl)
        const bytes = await response.arrayBuffer()
        const result = await WebAssembly.instantiate(bytes, importObject)
        wasmInstance = result.instance
    }

    const exports = wasmInstance.exports

    // Call WASM constructors
    if (exports.c) {
        exports.c()
    }

    // Export rnnoise functions
    Module._rnnoise_init = exports.d
    Module._rnnoise_create = exports.e
    Module._malloc = exports.f
    Module._rnnoise_destroy = exports.g
    Module._free = exports.h
    Module._rnnoise_process_frame = exports.i

    return Module
}
