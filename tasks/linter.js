'use strict'

var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var stylish = require('gulp-jscs-stylish');

var executeTest = function() {
  gulp.src(['./app/*.js', './app/api/**/**/*.js', './app/scripts/**/*js', './app/server/**/*js'])
    .pipe(jshint({
      esnext: true
    })) // hint (optional)
  .pipe(jscs()) // enforce style guide
  .pipe(stylish.combineWithHintResults()) // combine with jshint results
  .pipe(jshint.reporter('jshint-stylish'));
};

gulp.task('lint', executeTest);