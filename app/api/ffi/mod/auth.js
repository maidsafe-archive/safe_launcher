'use strict';

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
  var result = lib.create_unregistered_client(unregisteredClient);
  if (result !== 0) {
    return util.sendError(request.id, result);
  }
  unregisteredClientHandle = unregisteredClient.deref();
  util.send(request.id);
};

var setSafeDriveKey = function(lib) {
  var size;
  try {
    size = getSafeDriveKeySize(lib);
  } catch (e) {
    return e;
  }
  var content = new IntArray(size);
  var result = lib.get_safe_drive_key(content, registeredClientHandle);
  if (result !== 0) {
    return new Error('Failed with error code ' + result);
  }
  safeDriveKey = new Buffer(content).toString('base64');
  return;
};

var getSafeDriveKeySize = function(lib) {
  var size = ref.alloc('int');
  var res = lib.get_safe_drive_key_size(size, registeredClientHandle);
  if (res === 0) {
    return size.deref();
  }
  throw new Error('Failed with error code' + res);
};

var register = function(lib, request) {
  var params = request.params;
  var regClient = ref.alloc(clientHandlePtrPtr);
  var res = lib.create_account(params.keyword, params.pin, params.password, regClient);
  if (res !== 0) {
    return util.sendError(request.id, res);
  }
  registeredClientHandle = regClient.deref();
  var safeDriveError = setSafeDriveKey(lib);
  if(safeDriveError) {
    return util.sendError(request.id, 999, safeDriveError.toString());
  }
  util.send(request.id);
};

var login = function(lib, request) {
  var params = request.params;
  var regClient = ref.alloc(clientHandlePtrPtr);
  var res = lib.log_in(params.keyword, params.pin, params.password, regClient);
  if (res !== 0) {
    return util.sendError(request.id, res)
  }
  registeredClientHandle = regClient.deref();
  util.send(request.id);
};

exports.getRegisteredClient = function() {
  return registeredClientHandle;
};

exports.getSafeDriveKey = function() {
  return safeDriveKey;
};

exports.getUnregisteredClient = function() {
  return unregisteredClientHandle;
};

exports.drop = function(lib) {
  if (unregisteredClientHandle) {
    lib.drop_client(unregisteredClientHandle);
  }
  if (registeredClientHandle) {
    lib.drop_client(registeredClientHandle);
  }
};

exports.getMethods = function() {
  return {
    'create_unregistered_client': ['int', [clientHandlePtrPtr]],
    'create_account': ['int', ['string', 'string', 'string', clientHandlePtrPtr]],
    'log_in': ['int', ['string', 'string', 'string', clientHandlePtrPtr]],
    'get_safe_drive_key_size': ['int', [intPtr, clientHandlePtrPtr]],
    'get_safe_drive_key': ['int', [IntArray, clientHandlePtrPtr]],
    'drop_client': ['void', [clientHandlePtrPtr]]
  };
};

exports.execute = function(lib, request) {
  switch (request.action) {
    case 'unregistered-client':
      unregisteredClient(lib, request);
      break;
    case 'register':
      register(lib, request);
      break;
    case 'login':
      login(lib, request);
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
