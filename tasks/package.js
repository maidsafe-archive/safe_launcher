'use strict';

var gulp = require('gulp');
var utils = require('./utils');
var childProcess = require('child_process');
var pathUtil = require('path');
var electronVersion = require(pathUtil.resolve('./node_modules/electron-prebuilt/package.json')).version;

var packagerPath = pathUtil.resolve('./node_modules/.bin/electron-packager');
if (process.platform === 'win32') {
  packagerPath += '.cmd';
}

var packageForOs = {
  osx: {
    icon: 'resources/osx/icon.icns',
    unpack: '*.dylib',
    platform: 'darwin'
  },
  linux: {
    icon: 'resources/windows/icon.ico',
    unpack: '*.so',
    platform: 'linux'
  },
  windows: {
    icon: 'resources/windows/icon.ico',
    unpack: '*.dll',
    platform: 'win32'
  }
};

var packageApp = function() {
  var config = packageForOs[utils.os()];
  childProcess.spawn(packagerPath, [
    'build',
    'safe_launcher',
    '--icon=' + config.icon,
    '--platform=' + config.platform,
    '--asar',
    '--asar-unpack=' + config.icon,
    '--out=app_dist',
    '--prune',
    '--arch=x64',
    '--version=' + electronVersion,
    '--overwrite'
  ], {
    stdio: 'inherit'
  });
};

gulp.task('package', ['build'], packageApp);
