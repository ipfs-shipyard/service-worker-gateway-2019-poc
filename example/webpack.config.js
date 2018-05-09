module.exports = {
  entry: {
    'service-worker-bundle': './src/index.js',
    bundle: './public/index.js'
  },
  output: {
    filename: 'public/[name].js'
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    alias: {
      zlib: 'browserify-zlib-next'
    }
  }
}
