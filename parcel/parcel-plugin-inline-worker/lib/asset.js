const { Asset } = require('parcel-bundler');
const JSAsset = require('parcel-bundler/src/assets/JSAsset')

class InlineWorkerAsset extends JSAsset {
  constructor(name, pkg, options) {
    super(name, pkg, options);

    // Note: We do a simply check to see if the JS file is declared as a worker
    if (name.includes('.worker.js')) {
      this.isWorkerJs = true
    }
  }

  async generate() {
    const original = await super.generate()

    // Return JS with inlined Worker
    if (this.isWorkerJs) {

      //const code = original[0].value;
      
      return {
        js: `
          module.exports.init = function() { 
            const blob = new Blob([${JSON.stringify(original)}], { type: 'text/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            return new Worker(workerUrl) 
          };
        `
      };
    }

    // Return original JS with no modification
    return original
  }
}

module.exports = InlineWorkerAsset
