'use strict'

var gulp = require('gulp');
var gutils = require('gulp-util');
var pathUtil = require('path');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var stylish = require('gulp-jscs-stylish');
var childProcess = require('child_process');
var babel = require('gulp-babel');
var fse = require('fs-extra')
var path = require('path');
var os = require('os');
var exec = require('child_process').exec;
var gulpMocha = require('gulp-electron-mocha');

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


var gulpPath = pathUtil.resolve('./node_modules/.bin/electron-mocha');
if (process.platform === 'win32') {
  gulpPath += '.cmd';
}

process.env['mocha-unfunk-style'] = 'plain';

// var runMochaTests = function(cb) {
//   childProcess.spawn(gulpPath, [
//     '--renderder',
//     '--compilers',
//     'js:babel-core/register',
//     '--timeout',
//     '50000',
//     '-R',
//     'mocha-unfunk-reporter',
//     './tests/*'
//   ], {
//     stdio: 'inherit'
//   }).on('exit', function() {
//     cb();
//   });
// }

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

gulp.task('clean', function() {
  fse.removeSync('./testApp/api');
  fse.removeSync('./testApp/server');
});

gulp.task('copy', function() {
  fse.copySync(path.resolve('./app/api/ffi', ffiName), path.resolve(destDir, 'api', 'ffi', ffiName));
  var ls = exec('ls ./testApp/api/ffi', function (error, stdout, stderr) {
   if (error) {
     console.log(error.stack);
     console.log('Error code: ' + error.code);
     console.log('Signal received: ' + error.signal);
   }
   console.log('Child Process STDOUT: ' + stdout);
   console.log('Child Process STDERR: ' + stderr);
 });

 ls.on('exit', function (code) {
   console.log('Child process exited with exit code ' + code);
 });
  fse.copySync('./app/package.json', path.resolve(destDir, 'package.json'));
});

gulp.task('installPackages', function(cb) {
  exec('cd testApp && npm install && cd .. && gulp msvc_rebuild --env=test', function(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(error);
  });
});

gulp.task('mocha', function() {
  gulp.src('./tests', {read: false})
  .pipe(gulpMocha.default({
    electronMocha: {
      renderer: true,
      'timeout': 50000,
      compilers: 'js:babel-core/register',
      R: 'mocha-unfunk-reporter',
    }
  }))
});

// var executeTest = function(cb) {
//   gulp.src(['./app/*.js', './app/api/**/**/*.js', './app/scripts/**/*js'])
//     .pipe(jshint({
//       esnext: true
//     })) // hint (optional)
//   .pipe(jscs()) // enforce style guide
//   .pipe(stylish.combineWithHintResults()) // combine with jshint results
//   .pipe(jshint.reporter('jshint-stylish'));
// };

gulp.task('test', [ 'clean', 'babelApi', 'babelServer', 'copy', 'installPackages', 'mocha' ]);
