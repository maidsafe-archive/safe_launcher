module.exports = function(libPath) {
  var ffi = require('ffi');
  var path = require('path');
  var ref = require('ref');
  var int = ref.types.int;
  var ArrayType = require('ref-array');
  var util = require('./util.js');

  var intPtr = ref.refType(int);
  var IntArray = ArrayType(int);
  var clientHandle = ref.types.void;
  var clientHandlePtr = ref.refType(clientHandle);
  var clientHandlePtrPtr = ref.refType(clientHandlePtr);

  var lib;
  var auth = require('./auth.js');
  var nfs = require('./nfs.js');
  var dns = require('./dns.js');

  var methodsToRegister = function() {
    return {
      'create_unregistered_client': [ 'int', [ clientHandlePtrPtr ] ],
      'create_account': [ 'int', [ 'string', 'string', 'string', clientHandlePtrPtr ] ],
      'log_in': [ 'int', [ 'string', 'string', 'string', clientHandlePtrPtr ] ],
      'get_safe_drive_key': [ 'pointer', [ intPtr, intPtr, intPtr, clientHandlePtrPtr ] ],
      'get_app_dir_key': [ 'pointer', [ 'string', 'string', 'string', intPtr, intPtr, intPtr, clientHandlePtrPtr ] ],
      'execute': [ 'int', [ 'string', clientHandlePtrPtr ] ],
      'execute_for_content': [ 'pointer', [ 'string', intPtr, intPtr, intPtr, clientHandlePtrPtr ] ],
      'drop_client': [ 'void', [ clientHandlePtrPtr ] ],
      'drop_vector': [ 'void', [ 'pointer', int, int ] ],
      'drop_null_ptr': [ 'void', [ 'pointer' ] ]
    };
  };

  var getClientHandle = function(message) {
    if (!lib) {
      throw 'FFI library not yet initialised';
    }
    return message.isAuthorised ? auth.getRegisteredClient() : auth.getUnregisteredClient(lib);
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
          if (message.isAuthorised) {
            message.safeDriveKey = auth.getSafeDriveKey();
          }
          nfs.execute(lib, message);
          break;

        case 'dns':
          message.client = getClientHandle(message);
          if (message.isAuthorised) {
            message.safeDriveKey = auth.getSafeDriveKey();
          }
          dns.execute(lib, message);
          break;

        default:
          util.sendError(message.id, 999, 'Module not found');
      }
    } catch (e) {
      util.sendError(message.id, 999, e.toString());
    }
  };

  this.cleanup = function() {
    auth.drop(lib);
  };
};
