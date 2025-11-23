const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  ignoreWarnings: [
    {
      module: /chat\.js/,
      message: /Critical dependency/
    }
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'node_modules/ice/lib/Ice.js',
          to: 'Ice.js'
        },
        {
          from: 'src/generated/chat.js',
          to: 'chat.js'
        },
        {
          from: 'public/config',
          to: 'config'
        }
      ]
    })
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist')
      },
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/'
      }
    ],
    compress: true,
    port: 8080,
    hot: true
  },
  resolve: {
    extensions: ['.js'],
    fallback: {
      "buffer": false,
      "crypto": false,
      "stream": false,
      "fs": false,
      "net": false,
      "tls": false,
      "child_process": false,
      "dns": false,
      "http": false,
      "https": false,
      "os": false,
      "path": false,
      "zlib": false
    }
  }
};
