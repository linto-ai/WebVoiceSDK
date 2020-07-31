const path = require("path")
const fs = require("fs")

module.exports = function(bundler) {
  bundler.addAssetType('bin', require.resolve('./asset'))
}