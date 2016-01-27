'use strict'
var childProcess = require('child_process');
var pathUtil = require('path');
var gulp = require('gulp');

var gulpPath = pathUtil.resolve('./node_modules/.bin/electron-mocha');
if (process.platform === 'win32') {
    gulpPath += '.cmd';
}

process.env['mocha-unfunk-style'] = 'plain';

var runTests = function() {
  childProcess.spawn(gulpPath, [
      '-R',
      'mocha-unfunk-reporter',
      './tests/*'
  ], {
      stdio: 'inherit'
  });
}

gulp.task('mocha-test', runTests);
