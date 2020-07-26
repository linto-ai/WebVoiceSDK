const { Asset } = require('parcel-bundler');
const RawAsset = require('parcel-bundler/src/assets/RawAsset');
const JSAsset = require('parcel-bundler/src/assets/JSAsset');

// Implemented "blobbing" of wasm file like https://github.com/ballercat/wasm-loader does
// Or maybe as a response for fetch inside WebAssemly.instantiateStreaming https://github.com/DevAndyLee/js-inline-wasm
class WASMAsset extends Asset{
  constructor(name, pkg, options) {
    super(name, pkg, options);
    this.type = 'wasm';
    this.encoding = null;
  }

  async generate() {
    let js = `
    module.exports.wasmUrl = function() {
      const encodedWasm = "${Buffer.from(this.contents,'binary').toString('base64')}"
      const binaryWasmString = atob(encodedWasm)
      const buf = new Uint8Array(binaryWasmString.length)
      for (var i = 0; i < binaryWasmString.length; i++) {
        buf[i] = binaryWasmString.charCodeAt(i);
      }
      //const fetchableWasm = new Response(buf.buffer, { status: 200, headers: { "Content-Type": "application/wasm" } })
      //return fetchableWasm
      const blob = new Blob([buf], { type: 'application/wasm' });
      const wasmUrl = URL.createObjectURL(blob);
      return wasmUrl
    }
    `;

    // const buf = new Uint8Array(${JSON.stringify(Array.from(this.contents))});
    // const m = new WebAssembly.Module(buf);
    // return new WebAssembly.Instance(m)

    return {
      js
    };
  }
}

module.exports = WASMAsset

