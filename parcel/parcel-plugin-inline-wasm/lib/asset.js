const { Asset } = require('parcel-bundler');
const RawAsset = require('parcel-bundler/src/assets/RawAsset');
const JSAsset = require('parcel-bundler/src/assets/JSAsset');

//Trying to implement "blobbing" of wasm file like https://github.com/ballercat/wasm-loader does
class WASMAsset extends Asset{
  constructor(name, pkg, options) {
    super(name, pkg, options);
    this.type = 'wasm';
    this.encoding = null;
    console.log(name)
  }

  async generate() {

    let js = `
    module.exports.wasmUrl = function() {
      const buf = new Uint8Array(${JSON.stringify(Array.from(this.contents))});
      const blob = new Blob(buf, { type: 'application/wasm' });
      console.log(blob)
      const wasmUrl = URL.createObjectURL(blob);
      return wasmUrl
    }
    `;

    console.log(js)
    return {
      js
    };
  }
}

module.exports = WASMAsset

