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
    'data': {}
  };
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  if (request.params.hasOwnProperty('dirPath')) {
    payload.data.dir_path = request.params.dirPath;
  }
  if (request.params.hasOwnProperty('filePath')) {
    payload.data.file_path = request.params.filePath;
  }
  if (request.params.hasOwnProperty('isPrivate')) {
    payload.data.is_private = request.params.isPrivate;
  }
  if (request.params.hasOwnProperty('isVersioned')) {
    payload.data.is_versioned = request.params.isVersioned;
  }
  if (request.params.hasOwnProperty('userMetadata')) {
    payload.data.user_metadata = request.params.userMetadata;
  }
  if (request.params.hasOwnProperty('isPathShared')) {
    payload.data.is_path_shared = request.params.isPathShared;
  }
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  return payload;
};

var createDirectory = function(lib, request) {
  try {
    var payload = createPayload('create-dir', request);
    var result = lib.execute(JSON.stringify(payload), request.client);
    if (result === 0) {
      return util.send(request.id, true);
    }
    util.sendError(request.id, result);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
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
    util.sendError(request.id, 999, e.toString());
  }
};

var deleteDirectory = function(lib, request) {
  try {
    var payload = createPayload('delete-dir', request);
    var result = lib.execute(JSON.stringify(payload), request.client);
    if (result === 0) {
      return util.send(request.id, true);
    }
    util.sendError(request.id, result);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var modifyDirectory = function(lib, request) {
  try {
    var payload = createPayload('modify-dir', request);
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    if (request.params.newValues.hasOwnProperty('name')) {
      payload.data.new_values.name = request.params.newValues.name;
    }
    if (request.params.newValues.hasOwnProperty('userMetadata')) {
      payload.data.new_values.user_metadata = request.params.newValues.userMetadata;
    }
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    var result = lib.execute(JSON.stringify(payload), request.client);
    if (result === 0) {
      return util.send(request.id, true);
    }
    util.sendError(request.id, result);
  } catch (e) {
    util.sendError(request.id, 999, e.message());
  }
};

var createFile = function(lib, request) {
  try {
    var payload = createPayload('create-file', request);
    var result = lib.execute(JSON.stringify(payload), request.client);
    if (result === 0) {
      return util.send(request.id, true);
    }
    util.sendError(request.id, result);
  } catch (e) {
    util.sendError(request.id, 999, e.message());
  }
};

var deleteFile = function(lib, request) {
  try {
    var payload = createPayload('delete-file', request);
    var result = lib.execute(JSON.stringify(payload), request.client);
    if (result === 0) {
      return util.send(request.id, true);
    }
    util.sendError(request.id, result);
  } catch (e) {
    util.sendError(request.id, 999, e.message());
  }
};

var modifyFileMeta = function(lib, request) {
  try {
    var payload = createPayload('modify-file', request);
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    if (request.params.newValues.hasOwnProperty('name')) {
      payload.data.new_values.name = request.params.newValues.name;
    }
    if (request.params.newValues.hasOwnProperty('userMetadata')) {
      payload.data.new_values.user_metadata = request.params.newValues.userMetadata;
    }
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.send(999, payload);
    return;
    var result = lib.execute(JSON.stringify(payload), request.client);
    if (result === 0) {
      return util.send(request.id, true);
    }
    util.sendError(request.id, result);
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
    case 'delete-dir':
      deleteDirectory(lib, request);
      break;
    case 'modify-dir':
      modifyDirectory(lib, request);
      break;
    case 'create-file':
      createFile(lib, request);
      break;
    case 'delete-file':
      deleteFile(lib, request);
      break;
    case 'modify-file-meta':
      modifyFileMeta(lib, request);
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
