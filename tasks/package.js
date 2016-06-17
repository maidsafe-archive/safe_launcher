'use strict';

var gulp = require('gulp');
var utils = require('./utils');
var gutil = require('gulp-util');
var fs = require('fs');
var fse = require('fs-extra');
var os = require('os');
var childProcess = require('child_process');
var pathUtil = require('path');
var electronVersion = require(pathUtil.resolve('./node_modules/electron-prebuilt/package.json')).version;
var exec = require('gulp-exec');

var BINARY_NAME = 'safe_launcher';
var OUT_FOLDER = 'app_dist';

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

var config = packageForOs[utils.os()];

var appVersion = require(pathUtil.resolve('./app/package.json')).version;
var packageName = BINARY_NAME + '-' + config.platform + '-' + os.arch();
var packageNameWithVersion = BINARY_NAME + '-v' + appVersion + '-' + config.platform + '-' + os.arch();

var onPackageCompleted = function() {
  var packagePath = pathUtil.resolve('.', OUT_FOLDER, BINARY_NAME + '-' + os.platform() + '-' + os.arch());
  var versionFileName = 'version';
  var filesToRemove = [ 'LICENSE', 'LICENSES.chromium.html' ];

  var versionFilePath = pathUtil.resolve(packagePath, versionFileName);

  filesToRemove.forEach(function(fileName) {
    fileName = pathUtil.resolve(packagePath, fileName);
    try {
      fs.unlinkSync(fileName);
    } catch (e) {
      if (e.code === 'ENOENT') {
        gutil.log('%s file not present to be deleted', fileName);
      } else {
        throw e;
      }
    }
  });
  gutil.log('Updating version file');
  fs.writeFileSync(versionFilePath, appVersion);
  fs.renameSync(pathUtil.resolve(OUT_FOLDER, packageName),
    pathUtil.resolve(OUT_FOLDER, packageNameWithVersion));
};

var packageApp = function() {
  fse.removeSync(pathUtil.resolve(OUT_FOLDER));
  var reportOptions = {
  	err: true, // default = true, false means don't write err
  	stderr: true, // default = true, false means don't write stderr
  	stdout: true // default = true, false means don't write stdout
  }
  return gulp.src('./')
  .pipe(exec(packagerPath + ' build ' + BINARY_NAME + ' --icon=' + config.icon + ' --platform=' + config.platform +
  ' --asar --asar-unpack=' + config.unpack + ' --out=' + OUT_FOLDER + ' --arch=' + os.arch() + ' --version=' + electronVersion +
  ' --overwrite'))
  .pipe(exec.reporter(reportOptions));
};
gulp.task('packageApp', ['build'], packageApp);

gulp.task('package', ['packageApp'], onPackageCompleted);
