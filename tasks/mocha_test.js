'use strict'

var gulp = require('gulp');
var gutils = require('gulp-util');
var pathUtil = require('path');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var stylish = require('gulp-jscs-stylish');
var childProcess = require('child_process');
var babel = require('gulp-babel');
var fse = require('fs-extra');
var path = require('path');
var os = require('os');
var gulpMocha = require('gulp-electron-mocha');
var install = require("gulp-install");
var exec = require('gulp-exec');

var destDir = path.resolve('testApp');
var ffiName = null;

if (os.platform() === 'darwin') {
  ffiName = 'libsafe_core.dylib';
} else if(os.platform() === 'linux') {
  ffiName = 'libsafe_core.so';
} else {
  ffiName = 'safe_core.dll';
}
var apiPaths = [
  './app/api/**',
  '!./app/api/ffi/' + ffiName
];

var serverPaths = [
  './app/server/**',
];

var loggerPaths = [
  './app/logger/**',
];

var rootPaths = [
  './app/env.js'
];


var gulpPath = pathUtil.resolve('./node_modules/.bin/electron-mocha');
if (process.platform === 'win32') {
  gulpPath += '.cmd';
}

process.env['mocha-unfunk-style'] = 'plain';

gulp.task('babelApi', function() {
  gulp.src(apiPaths)
  .pipe(babel())
  .pipe(gulp.dest(path.resolve(destDir, 'api')));
});

gulp.task('babelServer', function() {
  gulp.src(serverPaths)
  .pipe(babel())
  .pipe(gulp.dest(path.resolve(destDir, 'server')));
});

gulp.task('babelLogger', function() {
  gulp.src(loggerPaths)
  .pipe(babel())
  .pipe(gulp.dest(path.resolve(destDir, 'logger')));
});

gulp.task('babelRoot', function() {
  gulp.src(rootPaths)
  .pipe(babel())
  .pipe(gulp.dest(path.resolve('.', destDir)));
});

gulp.task('clean', function() {
  fse.removeSync('./testApp/api');
  fse.removeSync('./testApp/server');
  fse.removeSync('./testApp/*.js');
  fse.removeSync('./testApp/*.json');
});

gulp.task('copy', function() {
  fse.copySync(path.resolve('./app/api/ffi', ffiName), path.resolve(destDir, 'api', 'ffi', ffiName));
  fse.copySync('./app/package.json', path.resolve(destDir, 'package.json'));
});

gulp.task('test_finalize', function() {
  var manifest = fse.readJsonSync(path.resolve(destDir, 'package.json'));
  manifest.env = fse.readJsonSync(path.resolve('.', 'config', 'env_test.json'));
  fse.writeJsonSync(path.resolve(destDir, 'package.json'), manifest);
});

gulp.task('installPackages', function() {
  return gulp.src('./testApp/package.json')
  .pipe(gulp.dest('./testApp'))
  .pipe(install());
});

gulp.task('test_msvc_rebuild', [ 'installPackages' ], function() {
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
  return gulp.src(path.resolve(__dirname, '..'))
  .pipe(exec('cd <%= file.path %> && gulp msvc_rebuild --env=test'))
  .pipe(exec.reporter(reportOptions));
});

gulp.task('mocha', [ 'test_msvc_rebuild' ], function() {
  return gulp.src('./tests', {read: false})
  .pipe(gulpMocha.default({
    electronMocha: {
      renderer: true,
      'timeout': 50000,
      compilers: 'js:babel-core/register',
      R: 'mocha-unfunk-reporter',
    }
  }))
});

// var executeTest = function() {
//   gulp.src(['./app/*.js', './app/api/**/**/*.js', './app/scripts/**/*js', './app/server/**/*js'])
//     .pipe(jshint({
//       esnext: true
//     })) // hint (optional)
//   .pipe(jscs()) // enforce style guide
//   .pipe(stylish.combineWithHintResults()) // combine with jshint results
//   .pipe(jshint.reporter('jshint-stylish'));
// };

gulp.task('test', [ 'clean', 'babelApi', 'babelServer', 'babelLogger', 'babelRoot', 'copy', 'test_finalize', 'mocha' ]);
