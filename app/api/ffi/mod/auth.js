'use strict';

var ref = require('ref');
var int = ref.types.int;
var ArrayType = require('ref-array');

var intPtr = ref.refType(int);
var IntArray = ArrayType(int);
var clientHandle = ref.types.void;
var clientHandlePtr = ref.refType(clientHandle);
var clientHandlePtrPtr = ref.refType(clientHandlePtr);

var safeDriveKey;
var registeredClientHandle;
var unregisteredClientHandle;

var unregisteredClient = function(lib) {
  var unregisteredClient = ref.alloc(clientHandlePtrPtr);
  var result = lib.create_unregistered_client(unregisteredClient);
  if (result == 0) {
    unregisteredClientHandle = unRegClient.deref();
    process.send('Access granted');
  } else {
    process.send('Failed with code ' + result);
  }
};

var setSafeDriveKey = function(lib) {
  var size;
  try {
    size = getSafeDriveKeySize(lib);
  } catch (e) {
    return process.send('eee ' + e);
  }
  var content = new IntArray(size);
  var result = lib.get_safe_drive_key(content, registeredClientHandle);
  if (result != 0) {
    return process.send('Err ' + result);
  }
  safeDriveKey = new Buffer(content).toString('base64');
};

var getSafeDriveKeySize = function(lib) {
  var size = ref.alloc('int');
  var res = lib.get_safe_drive_key_size(size, registeredClientHandle);
  if (res == 0) {
    return size.deref();
  }
  throw new Error('Failed with error code' + res);
};

var register = function(lib, request) {
  var params = request.params;
  var regClient = ref.alloc(clientHandlePtrPtr);
  var res = lib.create_account(params.keyword, params.pin, params.password, regClient);
  if (res == 0) {
    registeredClientHandle = regClient.deref();
    setSafeDriveKey(lib);
    process.send('Registerd Successfully');
  } else {
    process.send('Failed with code ' + res);
  }
};

var login = function(lib, request) {
  var params = request.params;
  var regClient = ref.alloc(clientHandlePtrPtr);
  var res = lib.log_in(params.keyword, params.pin, params.password, regClient);
  if (res == 0) {
    registeredClientHandle = regClient.deref();
    process.send('Logged in Successfully');
  } else {
    process.send('Failed with code ' + res);
  }
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

exports.getMethods = function() {
  return {
    'create_unregistered_client': ['int', [clientHandlePtrPtr]],
    'create_account': ['int', ['string', 'string', 'string', clientHandlePtrPtr]],
    'log_in': ['int', ['string', 'string', 'string', clientHandlePtrPtr]],
    'get_safe_drive_key_size': ['int', [intPtr, clientHandlePtrPtr]],
    'get_safe_drive_key': ['int', [IntArray, clientHandlePtrPtr]]
  };
};

exports.execute = function(lib, request) {
  switch (request.action) {
    case 'unregistered-client':
      unregisteredClient(lib);
      break;
    case 'register':
      register(lib, request);
      break;
    case 'login':
      login(lib, request);
      break;
    default:
      process.send('Invalid Action');
  }
};
