module.exports = function(libPath) {
  var ffi = require('ffi');
  var path = require('path');
  var ref = require('ref');
  var int = ref.types.int;
  var ArrayType = require('ref-array');
  var STRING_TYPE = 'string';
  var intPtr = ref.refType(int);
  var Void = ref.types.void;
  var voidPtr = ref.refType(Void);
  var voidPtrPtr = ref.refType(voidPtr);
  var size_t = ref.types.size_t;
  var uint8 = ref.types.uint8;
  var Uint8Array = ArrayType(uint8);
  var refUin8Array = ref.refType(Uint8Array);
  var auth = require('./auth.js');
  var nfs = require('./nfs.js');
  var dns = require('./dns.js');
  var util = require('./util.js');

  var lib;
  var self = this;
  var LIB_LOAD_ERROR = 9999;

  var methodsToRegister = function() {
    return {
      'init_logging': [ int, [] ],
      'create_unregistered_client': [ int, [ voidPtrPtr ] ],
      'create_account': [ int, [ STRING_TYPE, STRING_TYPE, STRING_TYPE, voidPtrPtr ] ],
      'log_in': [ int, [ STRING_TYPE, STRING_TYPE, STRING_TYPE, voidPtrPtr ] ],
      'get_safe_drive_key': [ 'pointer', [ intPtr, intPtr, intPtr, voidPtrPtr ] ],
      'get_app_dir_key': [ 'pointer', [ STRING_TYPE, STRING_TYPE, STRING_TYPE, intPtr, intPtr, intPtr, voidPtrPtr ] ],
      'execute': [ int, [ STRING_TYPE, voidPtrPtr ] ],
      'execute_for_content': [ 'pointer', [ STRING_TYPE, intPtr, intPtr, intPtr, voidPtrPtr ] ],
      'drop_client': [ 'void', [ voidPtrPtr ] ],
      'drop_vector': [ 'void', [ 'pointer', int, int ] ],
      'register_network_event_observer': [ 'void', [ voidPtrPtr, 'pointer' ] ],
      'get_nfs_writer': [ int, [ STRING_TYPE, voidPtrPtr, voidPtrPtr ] ],
      'nfs_stream_write': [ int, [ voidPtrPtr, int, refUin8Array, size_t ] ],
      'nfs_stream_close': [ int, [ voidPtrPtr ] ]
    };
  };

  var unRegisteredClientObserver = ffi.Callback('void', [ int ], function(state) {
    util.sendConnectionStatus(state, false);
  });

  var registeredClientObserver = ffi.Callback('void', [ int ], function(state) {
    util.sendConnectionStatus(state, true);
  });

  var getClientHandle = function(message) {
    if (!lib) {
      throw new Error('FFI library not yet initialised');
    }
    return auth.getRegisteredClient() ? auth.getRegisteredClient() :
        auth.getUnregisteredClient(lib, unRegisteredClientObserver);
  };

  var loadLibrary = function() {
    try {
      lib = ffi.Library(libPath, methodsToRegister());
      /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
      return lib.init_logging() === 0;
      /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    } catch (e) {
      console.log('FFI load error', e);
    }
    return false;
  };

  self.dispatcher = function(message) {
    try {
      if (!lib && !loadLibrary()) {
        return unRegisteredClientObserver(LIB_LOAD_ERROR);
      }
      switch (message.module) {
        case 'auth':
          auth.execute(lib, message, registeredClientObserver);
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

        case 'connect':
          auth.getUnregisteredClient(lib, unRegisteredClientObserver);
          break;

        default:
          util.sendError(message.id, 999, 'Module not found');
      }
    } catch (e) {
      util.sendError(message.id, 999, e.message);
    }
  };
};
