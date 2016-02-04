module.exports = function(libPath) {
  var ffi = require('ffi');
  var path = require('path');

  var lib;
  var auth = require('./auth.js');
  var nfs = require('./nfs.js');
  var util = require('./util.js');
  var modules = [ auth, nfs ];

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

  var getClienthandle = function(message) {
    return message.isAuthorised ? auth.getRegisteredClient() : auth.getUnregisteredClient();
  };

  var loadLibrary = function() {
    try {
      lib = ffi.Library(libPath, methodsToRegister());
      return true;
    } catch (e) {}
    return false;
  };

  this.dispatcher = function(message) {
    try {
      if (!lib && !loadLibrary()) {
        return util.sendError(message.id, 999, 'Library did not load');
      }
      switch (message.module) {
        case 'auth':
          auth.execute(lib, message);
          break;

        case 'nfs':
          message.client = getClientHandle(message);
          message.safeDriveKey = auth.getSafeDriveKey();
          nfs.execute(getClientHandle(message), lib, message);
          break;

        default:
          util.sendError(message.id, 999, 'Module not found');
      }
    } catch (e) {
      process.send('Err ' + e);
    }
  };

  this.cleanup = function() {
    auth.drop(lib);
  };
};
