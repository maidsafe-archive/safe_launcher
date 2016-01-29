module.exports = function(libPath) {
  var ffi = require('ffi');
  var path = require('path');

  var auth = require('./auth.js');
  var modules = [auth];
  var lib;

  var methodsToRegister = function() {
    var fncs = {};
    var methods;
    for (var i in modules) {
      methods = modules[i].getMethods();
      for (var key in methods) {
        if (fncs[key]) {
          continue;
        }
        fncs[key] = methods[key];
      }
    }
    return fncs;
  };

  var loadLibrary = function() {
    try {
        lib = ffi.Library(libPath, methodsToRegister());
    } catch(e) {
      process.send('Load err' + libPath + ' ' + e);
    }
  };

  this.dispatcher = function(message) {
    try {
      if (!lib) {
        loadLibrary();
      }
      switch (message.module) {
        case 'auth':
          auth.execute(lib, message);
          break;

        default:
          process.send('Module NOT found');
      }
    } catch(e) {
      process.send('Err ' + e);
    }
  };
};
