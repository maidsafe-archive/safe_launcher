var ref = require('ref');
var int = ref.types.int;
var intPtr = ref.refType(int);

var util = require('./util.js');

var createPayload = function(action, request) {
  var payload = {
    'module': 'nfs',
    'action': action,
    'safe_drive_dir_key': request.safeDriveKey,
    'app_dir_key': request.appDirKey,
    'safe_drive_access': request.hasSafeDriveAccess || false,
    'data': {
      'dir_path': request.params.dirPath
    }
  };
  if (request.params.isPrivate) {
    payload.data['is_private'] = request.params.isPrivate;
  }
  if (request.params.isVersioned) {
    payload.data['is_versioned'] = request.params.isVersioned;
  }
  if (request.params.userMetadata) {
    payload.data['user_metadata'] = request.params.userMetadata;
  }
  if (request.params.isPathShared) {
    payload.data['is_path_shared'] = request.params.isPathShared;
  }
}

var createDirectory = function(lib, request) {
  try {
    var payload = createPayload('create-dir', request);
    var result = lib.execute(JSON.stringify(payload), request.client);
    if (result === 0) {
      return util.send(request.id, true);
    }
    util.sendError(request.id, result);
  } catch (e) {
    util.sendError(request.id, 999, e.message());
  }
};

var getDirectory = function(lib, request) {
  try {
    var payload = createPayload('get-dir', request);
    var sizePtr = ref.alloc(intPtr);
    var capacityPtr = ref.alloc(intPtr);
    var resultPtr = ref.alloc(intPtr);
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    var pointer = lib.execute_for_content(JSON.stringify(payload), sizePtr, capacityPtr, resultPtr, request.client);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    var result = resultPtr.deref();
    if (result !== 0) {
      /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
      lib.drop_null_ptr(pointer);
      /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
      return util.sendError(request.id, result);
    }
    var size = sizePtr.deref();
    var capacity = capacityPtr.deref();
    var response = ref.reinterpret(pointer, size).toString();
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    lib.drop_vector(pointer, size, capacity);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.send(request.id, response);
  } catch (e) {
    util.sendError(request.id, 999, e.message());
  }
};

exports.execute = function(lib, request) {
  switch (request.action) {
    case 'create-dir':
      createDirectory(lib, request);
      break;
    case 'get-dir':
      getDirectory(lib, request);
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
