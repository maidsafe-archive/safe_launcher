import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import merge from 'webpack-merge';
import path from 'path';
import os from 'os';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import baseConfig from './webpack.config.base';

const SAFE_CORE = {
  'win32': '*.dll',
  'darwin': '*.dylib',
  'linux': '*.so'
}

const config = merge(baseConfig, {
  devtool: 'cheap-module-source-map',

  entry: [
    'babel-polyfill',
    './app/index'
  ],

  output: {
    publicPath: '../dist/'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: []
      },
      {
        test: /\.less$/,
        loader: 'style!css!less'
      },
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        screw_ie8: true,
        warnings: false
      }
    }),
    new ExtractTextPlugin('style.css', { allChunks: true }),
    new CopyWebpackPlugin([
      { context: 'app/ffi', from: SAFE_CORE[os.platform()], flatten: true},
      { from: 'app/app.html' },
      { from: 'app/images', to: 'images' }
    ])
  ],
  target: 'electron-renderer'
});

export default config;
