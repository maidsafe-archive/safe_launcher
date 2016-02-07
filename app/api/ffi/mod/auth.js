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

var unregisteredClient = function(lib, request) {
  var unregisteredClient = ref.alloc(clientHandlePtrPtr);
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  var result = lib.create_unregistered_client(unregisteredClient);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  if (result !== 0) {
    return false;
  }
  unregisteredClientHandle = unregisteredClient.deref();
  return true;
};

var setSafeDriveKey = function(lib) {
  var sizePtr = ref.alloc(int);
  var capacityPtr = ref.alloc(int);
  var resultPtr = ref.alloc(int);
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  var pointer = lib.get_safe_drive_key(sizePtr, capacityPtr, resultPtr, registeredClientHandle);
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  var result = resultPtr.deref();
  if (result !== 0) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_null_ptr(pointer);
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

var register = function(lib, request) {
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
  var safeDriveError = setSafeDriveKey(lib);
  if (safeDriveError) {
    return util.sendError(request.id, 999, safeDriveError.toString());
  }
  util.send(request.id);
};

var login = function(lib, request) {
  var params = request.params;
  var regClient = ref.alloc(clientHandlePtrPtr);
  var res;
  try {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    res = lib.log_in(params.keyword, params.pin, params.password, regClient);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  } catch (e) {
    return util.sendError(request.id, 999, e.message());
  }
  if (res !== 0) {
    return util.sendError(request.id, res);
  }
  registeredClientHandle = regClient.deref();
  setSafeDriveKey(lib);
  util.send(request.id);
};

exports.getRegisteredClient = function() {
  return registeredClientHandle;
};

exports.getSafeDriveKey = function() {
  return safeDriveKey;
};

exports.getUnregisteredClient = function() {
  if (!unregisteredClientHandle && !unregisteredClient()) {
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
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    var pointer = lib.get_app_dir_key(appName, appId, vendor, sizePtr, capacityPtr, resultPtr, registeredClientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    var result = resultPtr.deref();
    if (result !== 0) {
      /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
      lib.drop_null_ptr(pointer);
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
    util.sendError(request.id, 999, e.message());
  }
};

exports.drop = function(lib) {
  if (unregisteredClientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_client(unregisteredClientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  }
  if (registeredClientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_client(registeredClientHandle);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  }
};

exports.getMethods = function() {
  return {
    'create_unregistered_client': [ 'int', [ clientHandlePtrPtr ] ],
    'create_account': [ 'int', [ 'string', 'string', 'string', clientHandlePtrPtr ] ],
    'log_in': [ 'int', [ 'string', 'string', 'string', clientHandlePtrPtr ] ],
    'get_safe_drive_key_size': [ 'int', [ intPtr, clientHandlePtrPtr ] ],
    'get_safe_drive_key': [ 'int', [ IntArray, clientHandlePtrPtr ] ],
    'get_app_dir_key_size': [ 'int', [ 'string', 'string', 'string', intPtr, clientHandlePtrPtr ] ],
    'get_app_dir_key': [ 'int', [ 'string', 'string', 'string', IntArray, clientHandlePtrPtr ] ],
    'drop_client': [ 'void', [ clientHandlePtrPtr ] ]
  };
};

exports.execute = function(lib, request) {
  switch (request.action) {
    case 'register':
      register(lib, request);
      break;
    case 'login':
      login(lib, request);
      break;
    case 'app-dir-key':
      getAppDirectoryKey(lib, request);
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
