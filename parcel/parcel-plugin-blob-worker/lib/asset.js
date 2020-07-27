const { Asset } = require('parcel-bundler');
const JSAsset = require('parcel-bundler/src/assets/JSAsset')

class InlineWorkerAsset extends JSAsset {
  constructor(name, pkg, options) {
    super(name, pkg, options);
    // Note: We do a simply check to see if the JS file is declared as a blob
    if (name.includes('.blob.js')) {
      this.isBlobJs = true
    }
  }

  //Prevent erratic minification for .blob.js files
  transform(){
    if (!this.isBlobJs) return super.transform()
  }

  async generate() {
    const original = await super.generate()

    // Return JS with inlined Worker as blob
    if (this.isBlobJs) {      
      return {
        js: `
          module.exports.init = function() {
            const blob = new Blob([${JSON.stringify(this.contents)}], { type: 'text/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            return new Worker(workerUrl) 
          };
        `
      };
    }

    // Else return original JS with no modification
    return original
  }
}

module.exports = InlineWorkerAsset
