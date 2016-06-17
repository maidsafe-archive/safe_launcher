'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var childProcess = require('child_process');
var path = require('path');
var os = require('os');
var electronVersion = require(path.resolve('./node_modules/electron-prebuilt/package.json')).version;
var exec = require('gulp-exec');

gulp.task('msvc_rebuild', function() {
  if (process.platform !== 'win32') {
    return gutil.log('msvc_rebuild is supported only on Windows');
  }
  var options = {
    continueOnError: false, // default = false, true means don't emit error event
    pipeStdout: false, // default = false, true means stdout is written to file.contents
    customTemplatingThing: "test" // content passed to gutil.template()
  };
  var reportOptions = {
  	err: true, // default = true, false means don't write err
  	stderr: true, // default = true, false means don't write stderr
  	stdout: true // default = true, false means don't write stdout
  }
  var rootFolder = gutil.env.env === 'test' ? 'testApp' : 'app';
  var packages = ['ref', 'ffi'];
  var targetPath = path.resolve(rootFolder, 'node_modules');
  return gulp.src('./')
  .pipe(exec('cd ' + path.resolve(targetPath, packages[0]) + ' && node-gyp rebuild --target=' +
      electronVersion + ' --arch=' + os.arch() + ' --dist-url=https://atom.io/download/atom-shell && cd .. && cd ' +
       packages[1] + ' && node-gyp rebuild --target=' +
      electronVersion + ' --arch=' + os.arch() + ' --dist-url=https://atom.io/download/atom-shell', options))
  .pipe(exec.reporter(reportOptions));
});
