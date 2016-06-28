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

var createNewValuesPayload = function(newValues) {
  var payload = {};
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  if (newValues.hasOwnProperty('name')) {
    payload.name = newValues.name;
  }
  if (newValues.hasOwnProperty('userMetadata')) {
    payload.user_metadata = newValues.userMetadata;
  }
  if (newValues.hasOwnProperty('content')) {
    payload.content = newValues.content;
  }
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
  return payload;
};

var createDirectory = function(lib, request) {
  try {
    var payload = createPayload('create-dir', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var getDirectory = function(lib, request) {
  try {
    var payload = createPayload('get-dir', request);
    util.executeForContent(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var deleteDirectory = function(lib, request) {
  try {
    var payload = createPayload('delete-dir', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var modifyDirectory = function(lib, request) {
  try {
    var payload = createPayload('modify-dir', request);
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    payload.data.new_values = createNewValuesPayload(request.params.newValues);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var createFile = function(lib, request) {
  try {
    var payload = createPayload('create-file', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var deleteFile = function(lib, request) {
  try {
    var payload = createPayload('delete-file', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var modifyFileMeta = function(lib, request) {
  try {
    var payload = createPayload('modify-file', request);
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    payload.data.new_values = createNewValuesPayload(request.params.newValues);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var modifyFileContent = function(lib, request) {
  try {
    var payload = createPayload('modify-file', request);
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    payload.data.new_values = createNewValuesPayload(request.params.newValues);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var getFile = function(lib, request) {
  try {
    var payload = createPayload('get-file', request);
    payload.data.offset = request.params.offset;
    payload.data.length = request.params.length;
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    payload.data.include_metadata = request.params.includeMetadata;
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.executeForContent(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var getFileMetadata = function(lib, request) {
  try {
    var payload = createPayload('get-file-metadata', request);
    util.executeForContent(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var move = function(lib, request, action) {
  try {
    var payload = createPayload(action, request);
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    payload.data.src_path = request.params.srcPath;
    payload.data.is_src_path_shared = request.params.isSrcPathShared;
    payload.data.dest_path = request.params.destPath;
    payload.data.is_dest_path_shared = request.params.isDestPathShared;
    payload.data.retain_source = request.params.retainSource;
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
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
    case 'get-file':
      getFile(lib, request);
      break;
    case 'get-file-metadata':
      getFileMetadata(lib, request);
      break;
    case 'modify-file-content':
      modifyFileContent(lib, request);
      break;
    case 'move-dir':
      move(lib, request, 'move-dir');
      break;
    case 'move-file':
      move(lib, request, 'move-file');
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
