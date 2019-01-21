const resolve = require('path').resolve

module.exports = {
  entry: {
    'service-worker-bundle': './src/index.js',
    bundle: './public/index.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          plugins: ['@babel/plugin-proposal-object-rest-spread']
        }
      }
    ]
  },
  output: {
    path: resolve('public'),
    filename: '[name].js'
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
