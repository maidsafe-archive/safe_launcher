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
      'init_logging': [ 'int', [] ],
      'create_unregistered_client': [ 'int', [ clientHandlePtrPtr ] ],
      'create_account': [ 'int', [ 'string', 'string', 'string', clientHandlePtrPtr ] ],
      'log_in': [ 'int', [ 'string', 'string', 'string', clientHandlePtrPtr ] ],
      'get_safe_drive_key': [ 'pointer', [ intPtr, intPtr, intPtr, clientHandlePtrPtr ] ],
      'get_app_dir_key': [ 'pointer', [ 'string', 'string', 'string', intPtr, intPtr, intPtr, clientHandlePtrPtr ] ],
      'execute': [ 'int', [ 'string', clientHandlePtrPtr ] ],
      'execute_for_content': [ 'pointer', [ 'string', intPtr, intPtr, intPtr, clientHandlePtrPtr ] ],
      'drop_client': [ 'void', [ clientHandlePtrPtr ] ],
      'drop_vector': [ 'void', [ 'pointer', int, int ] ],
      'register_network_event_observer': [ 'void', [ clientHandlePtrPtr, notifyFuncPtr ] ]
    };
  };

  var unRegisteredClientObserver = function(state) {
    util.send(0, {
      type: 'status',
      state: state,
      registeredClient: false
    });
  };

  var registeredClientObserver = function(state) {
    util.send(0, {
      type: 'status',
      state: state,
      registeredClient: true
    });
  };

  var getClientHandle = function(message) {
    if (!lib) {
      throw new Error('FFI library not yet initialised');
    }
    return auth.getRegisteredClient() ? auth.getRegisteredClient() : auth.getUnregisteredClient(lib, unRegisteredClientObserver);
  };

  var loadLibrary = function() {
    try {
      lib = ffi.Library(libPath, methodsToRegister());
      /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
      return lib.init_logging() === 0;
      /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    } catch (e) {
      console.log('Ffi load error', e);
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
          if (auth.getUnregisteredClient(lib, unRegisteredClientObserver)) {
            unRegisteredClientObserver(0);
          }
          break;

        default:
          util.sendError(message.id, 999, 'Module not found');
      }
    } catch (e) {
      util.sendError(message.id, 999, e.message);
    }
  };
};
