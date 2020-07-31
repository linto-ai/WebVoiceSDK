const { Asset } = require('parcel-bundler');

// Implemented "blobbing" of wasm file like https://github.com/ballercat/wasm-loader does
// Or maybe as a response for fetch inside WebAssemly.instantiateStreaming https://github.com/DevAndyLee/js-inline-wasm
class WASMAsset extends Asset{
  constructor(name, pkg, options) {
    super(name, pkg, options);
    this.type = 'js';
    this.encoding = null;
  }

  async generate() {
    let js = `
    const encodedWasm = "${Buffer.from(this.contents,'binary').toString('base64')}"
    const binaryWasmString = atob(encodedWasm)
    const buf = new Uint8Array(binaryWasmString.length)
    for (var i = 0; i < binaryWasmString.length; i++) {
      buf[i] = binaryWasmString.charCodeAt(i);
    }

    module.exports.forInstanciate = function() {
      const blob = new Blob([buf], { type: 'application/wasm' });
      const wasmUrl = URL.createObjectURL(blob);
      return wasmUrl
    }

    module.exports.forInstanciateStreaming = new Promise(resolve => {
      const fetchableWasm = new Response([buf], { status: 200, headers: { "Content-Type": "application/wasm" } })
      resolve(fetchableWasm)
    })
    `;

    return {
      js
    };
  }
}

module.exports = WASMAsset

