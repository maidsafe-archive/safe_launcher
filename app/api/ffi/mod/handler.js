module.exports = function(libPath) {
  var ffi = require('ffi');
  var path = require('path');
  var ref = require('ref');
  var int = ref.types.int;
  var ArrayType = require('ref-array');
  var cString = ref.types.CString;
  var intPtr = ref.refType(int);
  var Void = ref.types.void;
  var voidPtr = ref.refType(Void);
  var voidPtrPtr = ref.refType(voidPtr);
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  var size_t = ref.types.size_t;
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  var uint8 = ref.types.uint8;
  var Uint8Array = ArrayType(uint8);
  var refUin8Array = ref.refType(Uint8Array);
  var auth = require('./auth.js');
  var nfs = require('./nfs.js');
  var dns = require('./dns.js');
  var clientStats = require('./client_stats.js');
  var util = require('./util.js');

  var lib;
  var self = this;
  var LIB_LOAD_ERROR = -9999;

  var methodsToRegister = function() {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    return {
      'client_issued_deletes': [ int, [ voidPtrPtr ] ],
      'client_issued_gets': [ int, [ voidPtrPtr ] ],
      'client_issued_posts': [ int, [ voidPtrPtr ] ],
      'client_issued_puts': [ int, [ voidPtrPtr ] ],
      'create_account': [ int, [ cString, cString, voidPtrPtr ] ],
      'create_unregistered_client': [ int, [ voidPtrPtr ] ],
      'drop_client': [ 'void', [ voidPtrPtr ] ],
      'drop_vector': [ 'void', [ 'pointer', int, int ] ],
      'execute': [ int, [ cString, voidPtrPtr ] ],
      'execute_for_content': [ 'pointer', [ cString, intPtr, intPtr, intPtr, voidPtrPtr ] ],
      'get_account_info': [ int, [ voidPtrPtr, intPtr, intPtr ] ],
      'get_app_dir_key': [ 'pointer', [ cString, cString, cString, intPtr, intPtr, intPtr, voidPtrPtr ] ],
      'get_nfs_writer': [ int, [ cString, voidPtrPtr, voidPtrPtr ] ],
      'get_safe_drive_key': [ 'pointer', [ intPtr, intPtr, intPtr, voidPtrPtr ] ],
      'init_logging': [ int, [] ],
      'log_in': [ int, [ cString, cString, voidPtrPtr ] ],
      'nfs_create_file': [ int, [ cString, voidPtrPtr, voidPtrPtr ] ],
      'nfs_stream_close': [ int, [ voidPtrPtr ] ],
      'nfs_stream_write': [ int, [ voidPtrPtr, refUin8Array, size_t ] ],
      'output_log_path': [ 'pointer', [ cString, intPtr, intPtr, intPtr ] ],
      'register_network_event_observer': [ 'void', [ voidPtrPtr, 'pointer' ] ]
    };
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
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

  var dropClient = function() {
    dispatcher({
      module: 'auth',
      action: 'clean'
    });
  };

  var dropWriterHandles = function() {
    dispatcher({
      module: 'nfs',
      action: 'clean'
    });
  };

  var cleanUp = function() {
    if (auth.getRegisteredClient()) {
      dropWriterHandles();
    }
    dropClient();
  };

  var loadLibrary = function() {
    try {
      lib = ffi.Library(libPath, methodsToRegister());
      /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
      return lib.init_logging();
      /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    } catch (e) {
      util.sendLog('ERROR', 'FFI load error' + e.message);
    }
    return LIB_LOAD_ERROR;
  };

  var dispatcher = function(message) {
    try {
      if (!lib) {
        var code = loadLibrary();
        if (code !== 0) {
          lib = null;
          return util.sendError('logFilePath', code);
        }
      }
      switch (message.module) {
        case 'auth':
          auth.execute(lib, message, registeredClientObserver);
          break;

        case 'connect':
          auth.getUnregisteredClient(lib, unRegisteredClientObserver);
          break;

        case 'reset':
          cleanUp();
          break;

        case 'dns':
          message.client = getClientHandle(message);
          if (message.isAuthorised) {
            message.safeDriveKey = auth.getSafeDriveKey();
          }
          dns.execute(lib, message);
          break;

        case 'nfs':
          message.client = getClientHandle(message);
          if (message.isAuthorised) {
            message.safeDriveKey = auth.getSafeDriveKey();
          }
          nfs.execute(lib, message);
          break;

        case 'client-stats':
          message.client = getClientHandle(message);
          clientStats.execute(lib, message);
          break;

        case 'get-log-path':
          util.getLogFilePath(lib);
          break;
        default:
          util.sendException(message.id, 'Module not found');
      }
    } catch (e) {
      util.sendException(message.id, e.message);
    }
  };

  self.dispatcher = dispatcher;

  self.cleanUp = cleanUp;
};
