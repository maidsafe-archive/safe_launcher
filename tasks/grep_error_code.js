'use strict';
var gulp = require('gulp');
var fs = require('fs');
var pathUtil = require('path');
var through = require('through2');
var cp = require('child_process');

var matchWords = {
  'CORE': 'CLIENT_ERROR_START_RANGE',
  'NFS': 'NFS_ERROR_START_RANGE',
  'DNS': 'DNS_ERROR_START_RANGE'
};

var grepData = [];

var destFile = './app/server/error_code_lookup.js';
var template = 'export function errorCodeLookup(errCode) \{\n';

// restyle the code
var restyleFiles = function(fileArr, done) {
  fs.readFile(fileArr[0].path, (err, data) => {
    if (err) throw err;
    var fileContent = data.toString();
    fs.writeFile(fileArr[0].path, fileContent.replace(/=>\s*\{\s*/g, '=> {').replace(/\s*\}/g, '}'), (err, wData) => {
      if (err) throw err;
      fileArr.shift();
      if (fileArr.length !== 0) {
        restyleFiles(fileArr, done);
      } else {
        done();
      }
    });
  });
};

// grep error code
var grepFile = function(fileArr, done) {
  var spawn = cp.spawn('grep', [ '-i', fileArr[0].word, fileArr[0].path ]);
  var buf;
  spawn.stdout.on('data', function(data) {
    buf+=data;
  });
  spawn.on('exit', function() {
    grepData.push(buf.toString());
    fileArr.shift();
    if (fileArr.length === 0) {
      return done();
    }
    grepFile(fileArr, done);
  })
};

// formate template
var templateFile = function(grepContent) {
  var parsedData = [];
  for(let i = 0; i < grepContent.length; i++) {
    var tempObj = {};
    var dataArr = grepContent[i].split('\n');
    tempObj.startVal = dataArr[0].slice(dataArr[0].indexOf('= ') + 2, -1);
    tempObj.dataArr = dataArr;
    parsedData.push(tempObj);
  }
  template += '\tlet ' + matchWords.CORE + ' = ' + parsedData[0].startVal + ';\n';
  template += '\tlet ' + matchWords.NFS + ' = ' + parsedData[1].startVal + ';\n';
  template += '\tlet ' + matchWords.DNS + ' = ' + parsedData[2].startVal + ';\n';
  template += '\tswitch (errCode) {\n';

  var grepErrorArr = function(target) {
    for(let err in target) {
      if (err !== '0') {
        var caseMatch = target[err].indexOf('=> {') !== -1 ? '=> {' : '=> ';
        var caseIndex = target[err].indexOf(caseMatch);
        var caseIndexEnd = -1;
        if (caseIndex !== -1) {
          var caseStr = target[err].slice(caseIndex + caseMatch.length, caseIndexEnd);
          var statement = target[err].slice(0, caseIndex);
          if (statement.indexOf('(_)') !== -1) {
            statement = statement.replace(/\(_\)/g, '');
          }
          caseStr = caseStr.replace(/,\}\}/g, '');
          statement = statement.replace(/\{\D*\}/, '');
          template += '\t\tcase ' + caseStr.trim() + ':\n';
          template += '\t\t\treturn \'' + statement.trim() + '\';\n'
        }
      }
    }
  };
  for(let i = 0; i < parsedData.length; i++) {
    grepErrorArr(parsedData[i].dataArr);
  }
  template += '\t\tdefault:\n\t\t\treturn \'Unexpected error\';\n\t}\n};';
  fs.writeFile(pathUtil.resolve('.', destFile), template, (err, data) => {
    if (err) throw err;
    console.log(destFile + ' updated.');
  });
};

var grepStream = through({ objectMode: true }, function(srcFile, enc, cb) {
  var files = [
    {
      path: pathUtil.resolve(srcFile.path, 'core', 'errors.rs'),
      word: matchWords.CORE
    },
    {
      path: pathUtil.resolve(srcFile.path, 'nfs', 'errors.rs'),
      word: matchWords.NFS
    },
    {
      path: pathUtil.resolve(srcFile.path, 'dns', 'errors.rs'),
      word: matchWords.DNS
    }
  ];

  var afterRestyleFiles = () => {
    grepFile(files.slice(), function() {
      console.log('Finished grep');
      templateFile(grepData);
    });
  };
  restyleFiles(files.slice(), afterRestyleFiles);
  this.push(srcFile.path);
  cb();
});

gulp.task('grep_error_code', function() {
  gulp.src('./safe_core/src', { read: false })
  .pipe(grepStream);
});
