'use strict'

var gulp = require('gulp');
var pathUtil = require('path');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var stylish = require('gulp-jscs-stylish');
var childProcess = require('child_process');

var gulpPath = pathUtil.resolve('./node_modules/.bin/electron-mocha');
if (process.platform === 'win32') {
  gulpPath += '.cmd';
}

process.env['mocha-unfunk-style'] = 'plain';

var runMochaTests = function() {
  childProcess.spawn(gulpPath, [
    '--renderder',
    '--compilers',
    'js:babel-core/register',
    '--timeout',
    '30000',
    '-R',
    'mocha-unfunk-reporter',
    './tests/*'
  ], {
    stdio: 'inherit'
  });
}

var executeTest = function() {

  gulp.src(['./app/*.js', './app/api/**/**/*.js', './app/scripts/**/*js'])
    .pipe(jshint({
      esnext: true
    })) // hint (optional)
    .pipe(jscs()) // enforce style guide
    .pipe(stylish.combineWithHintResults()) // combine with jshint results
    .pipe(jshint.reporter('jshint-stylish'));

  // runMochaTests();
};

gulp.task('test', executeTest);
