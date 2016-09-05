/* eslint max-len: 0 */
import webpack from 'webpack';
import merge from 'webpack-merge';
import path from 'path';
import baseConfig from './webpack.config.base';

export default merge(baseConfig, {
  debug: true,
  context: path.join(__dirname),
  devtool: 'cheap-module-eval-source-map',

  entry: [
    'babel-polyfill',
    'webpack-hot-middleware/client?path=http://localhost:3000/__webpack_hmr',
    'webpack/hot/only-dev-server',
    './app/index'
  ],

  output: {
    publicPath: 'http://localhost:3000/dist/',
  },
  externals: {
    winston: 'winston'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['react-hot', 'babel'],
        include: path.join(__dirname, 'app'),
        exclude: [path.join(__dirname, 'app', 'api'), path.join(__dirname, 'app', 'server')]
      },
      {
        test: /\.global\.css$/,
        loaders: [
          'style-loader',
          'css-loader?sourceMap'
        ]
      },
      {
        test: /^((?!\.global).)*\.css$/,
        loaders: [
          'style-loader',
          'css-loader?modules&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
        ]
      },
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
    ]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ],
  target: 'electron-renderer'
});
