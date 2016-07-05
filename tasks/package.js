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
var packageConfig = require('./../app/package.json');
var util = require('util');

var OUT_FOLDER = 'app_dist';

var packagerPath = pathUtil.resolve('./node_modules/.bin/electron-packager');
if (process.platform === 'win32') {
  packagerPath += '.cmd';
}

// Notes for OSX
// - app-category-type is from https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/LaunchServicesKeys.html#//apple_ref/doc/uid/TP40009250-SW8
// - app-bundle-id and helper-bundle-id can only contain alpha numeric characters or '-' or '.'
var packageForOs = {
  osx: {
    icon: 'resources/osx/icon.icns',
    unpack: '*.dylib',
    platform: 'darwin',
    packageName: packageConfig.productName,
    packagePreference: '--app-bundle-id=' + packageConfig.identifier + ' --app-category-type=public.app-category.utilities ' +
    '--helper-bundle-id=' + packageConfig.identifier + 'helper'
  },
  linux: {
    icon: 'resources/windows/icon.ico',
    unpack: '*.so',
    platform: 'linux',
    packageName: packageConfig.productName.toLowerCase().replace(' ', '_'),
    packagePreference: ''
  },
  windows: {
    icon: 'resources/windows/icon.ico',
    unpack: '*.dll',
    platform: 'win32',
    packageName: packageConfig.productName,
    packagePreference: '--version-string.CompanyName=' + packageConfig.author + ' --version-string.ProductName=\"' + this.packageName +
    '\" --version-string.FileDescription=\"' + packageConfig.description + '\"'
  }
};

var config = packageForOs[utils.os()];

var appVersion = packageConfig.version;
var packageFolderName = util.format('%s-%s-%s', config.packageName, config.platform, os.arch());
var packageNameWithVersion = util.format('%s-v%s-%s-%s', config.packageName, appVersion, config.platform, os.arch());

var onPackageCompleted = function() {
  var packagePath = pathUtil.resolve('.', OUT_FOLDER, packageFolderName);
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
  fs.renameSync(pathUtil.resolve(OUT_FOLDER, packageFolderName),
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
      .pipe(exec(packagerPath + ' build \"' + config.packageName + '\" --icon=' + config.icon + ' --platform=' + config.platform +
          ' --asar --asar-unpack=' + config.unpack + ' --out=' + OUT_FOLDER + ' --arch=' + os.arch() + ' --version=' + electronVersion +
          ' --overwrite ' + config.packagePreference))
      .pipe(exec.reporter(reportOptions));
};
gulp.task('packageApp', ['build'], packageApp);

gulp.task('package', ['packageApp'], onPackageCompleted);
