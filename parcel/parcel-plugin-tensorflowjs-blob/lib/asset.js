const {
  Asset
} = require('parcel-bundler');
const fs = require("fs")
const path = require("path")

class TfjsBinAsset extends Asset {
  constructor(name, pkg, options) {
    super(name, pkg, options)
    // Loads the model.json which in the same folder of the weight manifest. We gonna hack some paths with "blob" URLS
    this.modelJSON = require(path.join(path.dirname(name), "model.json"))
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

    module.exports.blobModelPath = function() {
      const blob = new Blob([buf], { type: 'application/octet-stream' })
      const binBlobURL = URL.createObjectURL(blob)
      const model = ${JSON.stringify(this.modelJSON)}
      model.weightsManifest[0].paths[0] = binBlobURL.slice(binBlobURL.lastIndexOf("/") + 1)
      const modelBlob = new Blob([JSON.stringify(model)],{type: 'application/json'})
      const modelBlobPath = URL.createObjectURL(modelBlob)
      return modelBlobPath
    }
    `;

    return {
      js
    };
  }
}

module.exports = TfjsBinAsset