module.exports = function(bundler) {
  bundler.addAssetType('wasm', require.resolve('./asset'))
}