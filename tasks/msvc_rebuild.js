'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var childProcess = require('child_process');
var path = require('path');

var packagerPath = path.resolve('./node_modules/.bin/npm');
if (process.platform === 'win32') {
  packagerPath += '.cmd';
}

var executeMsvcRebuild = function() {
    var msvcVersion = gutil.env.msvc_version;
    if (!msvcVersion) {
      throw '--msvc_version params required';
    }
    var childp = childProcess.spawn(packagerPath, [
      'config',
      'set',
      'msvs_version',
      msvcVersion
    ]);

    childp.on('error', function(err) {
      gutil.log(err);
    });
};

gulp.task('msvc_rebuild', executeMsvcRebuild);
