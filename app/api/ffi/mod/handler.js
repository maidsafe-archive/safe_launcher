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
  var notifyFuncPtr = ffi.Function('void', [ 'int' ]);

  var lib;
  var auth = require('./auth.js');
  var nfs = require('./nfs.js');
  var dns = require('./dns.js');

  var LIB_LOAD_ERROR = 9999;
  var self = this;

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
      'drop_null_ptr': [ 'void', [ 'pointer' ] ],
      'register_network_event_observer': [ 'void', [ clientHandlePtrPtr, notifyFuncPtr ] ]
    };
  };

  var networkObserver = function(state) {
    util.send(0, {
      type: 'status',
      state: state
    });
  };

  var getClientHandle = function(message) {
    if (!lib) {
      throw new Error('FFI library not yet initialised');
    }
    return message.isAuthorised ? auth.getRegisteredClient() : auth.getUnregisteredClient(lib, networkObserver);
  };

  var loadLibrary = function() {
    try {
      lib = ffi.Library(libPath, methodsToRegister());
      return true;
    } catch (e) {
      console.log('Ffi load error', e);
    }
    return false;
  };

  self.cleanup = function() {
    auth.drop(lib);
  };

  self.dispatcher = function(message) {
    try {
      if (!lib && !loadLibrary()) {
        return util.sendError(message.id, LIB_LOAD_ERROR, 'Library did not load');
      }
      switch (message.module) {
        case 'auth':
          auth.execute(lib, message, networkObserver);
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

        case 'clean':
          self.cleanup();
          break;

        default:
          util.sendError(message.id, 999, 'Module not found');
      }
    } catch (e) {
      util.sendError(message.id, 999, e.message);
    }
  };
};
