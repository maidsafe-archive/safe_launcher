var ref = require('ref');
var int = ref.types.int;
var ArrayType = require('ref-array');
var util = require('./util.js');

var intPtr = ref.refType(int);
var IntArray = ArrayType(int);
var clientHandle = ref.types.void;
var clientHandlePtr = ref.refType(clientHandle);
var clientHandlePtrPtr = ref.refType(clientHandlePtr);

var safeDriveKey;
var registeredClientHandle;
var unregisteredClientHandle;

var registerObserver = function(lib, clientHandle, callback) {
  util.send('log', { level: 'DEBUG', msg: 'FFI/mod/auth.js - Registering observer' });
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.register_network_event_observer(clientHandle, callback);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
};

var dropUnregisteredClient = function(lib) {
  if (unregisteredClientHandle) {
    util.send('log', { level: 'DEBUG', msg: 'FFI/mod/auth.js - Dropping unregisteredClientHandle' });
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_client(unregisteredClientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.send('log', { level: 'DEBUG', msg: 'FFI/mod/auth.js - Dropped unregisteredClientHandle' });
    unregisteredClientHandle = null;
  }
};

var unregisteredClient = function(lib, observer) {
  var unregisteredClient = ref.alloc(clientHandlePtrPtr);
  util.send('log', { level: 'DEBUG', msg: 'FFI/mod/auth.js - Create Unregistered Client Handle' });
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  var result = lib.create_unregistered_client(unregisteredClient);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  if (result !== 0) {
    return false;
  }
  unregisteredClientHandle = unregisteredClient.deref();
  registerObserver(lib, unregisteredClientHandle, observer);
  return true;
};

var setSafeDriveKey = function(lib) {
  var sizePtr = ref.alloc(int);
  var capacityPtr = ref.alloc(int);
  var resultPtr = ref.alloc(int);
  util.send('log', { level: 'DEBUG', msg: 'FFI/mod/auth.js - get SafeDrive Dir Key' });
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  var pointer = lib.get_safe_drive_key(sizePtr, capacityPtr, resultPtr, registeredClientHandle);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  var result = resultPtr.deref();
  if (result !== 0) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_null_ptr(pointer);
    util.send('log', { level: 'ERROR', msg: ('FFI/mod/auth.js - get SafeDrive Dir Key with code ' + result) });
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    return new Error('Failed with error code ' + result);
  }
  var size = sizePtr.deref();
  var capacity = capacityPtr.deref();
  safeDriveKey = ref.reinterpret(pointer, size).toString('base64');
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.drop_vector(pointer, size, capacity);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  return;
};

var register = function(lib, request, observer) {
  var params = request.params;
  var regClient = ref.alloc(clientHandlePtrPtr);
  var res;
  try {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    res = lib.create_account(params.keyword, params.pin, params.password, regClient);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  } catch (e) {
    return util.sendError(request.id, 999, e.message());
  }
  if (res !== 0) {
    return util.sendError(request.id, res);
  }
  registeredClientHandle = regClient.deref();
  // dropUnregisteredClient(lib);
  registerObserver(lib, registeredClientHandle, observer);
  var safeDriveError = setSafeDriveKey(lib);
  if (safeDriveError) {
    return util.sendError(request.id, 999, safeDriveError.toString());
  }
  util.send(request.id);
};

var login = function(lib, request, observer) {
  var params = request.params;
  var regClient = ref.alloc(clientHandlePtrPtr);
  var res;
  try {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    res = lib.log_in(params.keyword, params.pin, params.password, regClient);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  } catch (e) {
    return util.sendError(request.id, 999, e.toString());
  }
  if (res !== 0) {
    return util.sendError(request.id, res);
  }
  registeredClientHandle = regClient.deref();
  // dropUnregisteredClient(lib);
  registerObserver(lib, registeredClientHandle, observer);
  var safeDriveError = setSafeDriveKey(lib);
  if (safeDriveError) {
    return util.sendError(request.id, 999, safeDriveError.toString());
  }
  util.send(request.id);
};

exports.getRegisteredClient = function() {
  return registeredClientHandle;
};

exports.getSafeDriveKey = function() {
  return safeDriveKey;
};

exports.getUnregisteredClient = function(lib, observer) {
  if (!unregisteredClientHandle && !unregisteredClient(lib, observer)) {
    return;
  }
  return unregisteredClientHandle;
};

var getAppDirectoryKey = function(lib, request) {
  try {
    if (!registeredClientHandle) {
      return util.sendError(request.id, 999, 'Client Handle not available');
    }
    var appName = request.params.appName;
    var appId = request.params.appId;
    var vendor = request.params.vendor;

    var sizePtr = ref.alloc(int);
    var capacityPtr = ref.alloc(int);
    var resultPtr = ref.alloc(int);
    util.send('log', { level: 'DEBUG', msg: 'FFI/mod/auth.js - Getting App Root Dir Key' });
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    var pointer = lib.get_app_dir_key(appName, appId, vendor, sizePtr, capacityPtr, resultPtr, registeredClientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    var result = resultPtr.deref();
    if (result !== 0) {
      /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
      lib.drop_null_ptr(pointer);
      util.send('log', {
        level: 'ERROR',
        msg: ('FFI/mod/auth.js - Getting App Root Dir Key failed with code ' + result)
      });
      /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
      return util.sendError(request.id, 999, 'Failed with error code ' + result);
    }
    var size = sizePtr.deref();
    var capacity = capacityPtr.deref();
    var appDirKey = ref.reinterpret(pointer, size).toString('base64');
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_vector(pointer, size, capacity);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.send(request.id, appDirKey);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

exports.drop = function(lib) {
  dropUnregisteredClient(lib);
  if (registeredClientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_client(registeredClientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    registeredClientHandle = null;
  }
};

exports.execute = function(lib, request, observer) {
  switch (request.action) {
    case 'register':
      register(lib, request, observer);
      break;
    case 'login':
      login(lib, request, observer);
      break;
    case 'app-dir-key':
      getAppDirectoryKey(lib, request);
      break;
    case 'drop-unregisterd-client':
      dropUnregisteredClient(lib);
      util.send(request.id, 'client dropped');
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
