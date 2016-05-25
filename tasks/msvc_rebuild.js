'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var childProcess = require('child_process');
var path = require('path');
var os = require('os');
var electronVersion = require(path.resolve('./node_modules/electron-prebuilt/package.json')).version;

var executeMsvcRebuild = function() {
    if (process.platform !== 'win32') {
      return gutil.log('msvc_rebuild is supported only on Windows');
    }
    var targetPaths = [ './app/node_modules/ref', './app/node_modules/ffi' ];
    var testTargetPaths = [ './testApp/node_modules/ref', './testApp/node_modules/ffi' ];
    targetPaths = gutil.env._[0] === 'test' ? testTargetPaths : targetPaths;
    targetPaths.forEach(function(target) {
      var childp = childProcess.exec('cd ' + path.resolve(target) + ' && node-gyp rebuild --target=' +
        electronVersion + ' --arch=' + os.arch() + ' --dist-url=https://atom.io/download/atom-shell', function(err, stdout) {
          if (err) {
            return gutil.log(err);
          }
          gutil.log(stdout);
        });
    });
};

gulp.task('msvc_rebuild', executeMsvcRebuild);
