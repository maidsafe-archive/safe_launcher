var ref = require('ref');
var int = ref.types.int;
var util = require('./util.js');

var clientHandle = ref.types.void;
var clientHandlePtr = ref.refType(clientHandle);
var clientHandlePtrPtr = ref.refType(clientHandlePtr);

var safeDriveKey;
var registeredClientHandle;
var unregisteredClientHandle;

var registerObserver = function(lib, clientHandle, callback) {
  util.sendLog('DEBUG', 'FFI/mod/auth.js - Registering observer');
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.register_network_event_observer.async(clientHandle, callback, function(err) {
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    if (err) {
      util.sendException(request.id, err.message);
    }
  });
};

var dropUnregisteredClient = function(lib) {
  if (unregisteredClientHandle) {
    util.sendLog('DEBUG', 'FFI/mod/auth.js - Dropping unregisteredClientHandle');
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_client.async(unregisteredClientHandle, function(err) {
      /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
      unregisteredClientHandle = null;
      if (err) {
        util.sendException(request.id, err.message);
      }
    });
  }
};

var unregisteredClient = function(lib, observer) {
  var unregisteredClient = ref.alloc(clientHandlePtrPtr);
  util.sendLog('DEBUG', 'FFI/mod/auth.js - Create Unregistered Client Handle');
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.create_unregistered_client.async(unregisteredClient, function(e, result) {
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    if (e || result !== 0) {
      return util.sendConnectionStatus(1, false);
    }
    unregisteredClientHandle = unregisteredClient.deref();
    registerObserver(lib, unregisteredClientHandle, observer);
    util.sendConnectionStatus(0, false);
  });
};

var setSafeDriveKey = function(lib, callback) {
  var sizePtr = ref.alloc(int);
  var capacityPtr = ref.alloc(int);
  var resultPtr = ref.alloc(int);
  util.sendLog('DEBUG', 'FFI/mod/auth.js - get SafeDrive Dir Key');
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.get_safe_drive_key.async(sizePtr, capacityPtr, resultPtr, registeredClientHandle, function(err, pointer) {
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    var result = resultPtr.deref();
    if (result !== 0) {
      util.sendLog('ERROR', 'FFI/mod/auth.js - get SafeDrive Dir Key with code ' + result);
      return callback(result);
    }
    var size = sizePtr.deref();
    var capacity = capacityPtr.deref();
    safeDriveKey = ref.reinterpret(pointer, size).toString('base64');
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_vector.async(pointer, size, capacity, function() {});
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    return callback(0);
  });
};

var register = function(lib, request, observer) {
  var params = request.params;
  var regClient = ref.alloc(clientHandlePtrPtr);

  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.create_account.async(params.location, params.password, regClient, function(err, res) {
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    if (err) {
      return util.sendError(request.id, 999, err.message);
    }
    if (res !== 0) {
      return util.sendError(request.id, res);
    }
    registeredClientHandle = regClient.deref();
    registerObserver(lib, registeredClientHandle, observer);
    setSafeDriveKey(lib, function(safeDriveError) {
      if (safeDriveError !== 0) {
        return util.sendError(request.id, safeDriveError, 'Fetching safe drive failed');
      }
      util.send(request.id);
      util.sendConnectionStatus(0, true);
    });
  });
};

var login = function(lib, request, observer) {
  var params = request.params;
  var regClient = ref.alloc(clientHandlePtrPtr);
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.log_in.async(params.location, params.password, regClient, function(err, res) {
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    if (err) {
      return util.sendException(request.id, err.message);
    }
    if (res !== 0) {
      return util.sendError(request.id, res);
    }
    registeredClientHandle = regClient.deref();
    // dropUnregisteredClient(lib);
    registerObserver(lib, registeredClientHandle, observer);
    setSafeDriveKey(lib, function(err) {
      if (err !== 0) {
        return util.sendError(request.id, err, 'Fetching safe drive failed');
      }
      util.send(request.id);
      util.sendConnectionStatus(0, true);
    });
  });
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
  if (!registeredClientHandle) {
    return util.sendError(request.id, 999, 'Client Handle not available');
  }
  var appName = request.params.appName;
  var appId = request.params.appId;
  var vendor = request.params.vendor;

  var sizePtr = ref.alloc(int);
  var capacityPtr = ref.alloc(int);
  var resultPtr = ref.alloc(int);
  util.sendLog('DEBUG', 'FFI/mod/auth.js - Getting App Root Dir Key');
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  lib.get_app_dir_key.async(appName, appId, vendor, sizePtr, capacityPtr, resultPtr,
      registeredClientHandle, function(err, pointer) {
        /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
        if (err) {
          util.sendException(request.id, err);
        }
        var result = resultPtr.deref();
        if (result !== 0) {
          util.sendLog('ERROR', 'FFI/mod/auth.js - Getting App Root Dir Key failed with code ' + result);
          return util.sendError(request.id, result, 'Failed with error code ' + result);
        }
        var size = sizePtr.deref();
        var capacity = capacityPtr.deref();
        var appDirKey = ref.reinterpret(pointer, size).toString('base64');
        /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
        lib.drop_vector.async(pointer, size, capacity, function() {});
        /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
        util.send(request.id, appDirKey);
      });
};

var cleanUp = function(lib) {
  if (unregisteredClientHandle) {
    dropUnregisteredClient(lib);
    unregisteredClientHandle = null;
  }
  if (registeredClientHandle) {
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_client.async(registeredClientHandle, function() {
      /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
      registeredClientHandle = null;
    });
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
    case 'drop-unregistered-client':
      dropUnregisteredClient(lib);
      util.send(request.id, 'client dropped');
      break;
    case 'clean':
      cleanUp(lib);
      break;
    default:
      util.sendException(request.id, new Error('Invalid action'));
  }
};
