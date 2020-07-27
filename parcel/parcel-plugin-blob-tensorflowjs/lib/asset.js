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
    const encodedBin = "${Buffer.from(this.contents,'binary').toString('base64')}"
    const binString = atob(encodedBin)
    const buf = new Uint8Array(binString.length)
    for (var i = 0; i < binString.length; i++) {
      buf[i] = binString.charCodeAt(i);
    }

    module.exports.weightsURL = function() {
      const blob = new Blob([buf], { type: 'application/octet-stream' });
      const binBlobURL = URL.createObjectURL(blob);
      return binBlobURL
    }
    `;

    return {
      js
    };
  }
}

module.exports = WASMAsset

