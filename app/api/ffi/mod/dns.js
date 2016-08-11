var util = require('./util.js');

var createPayload = function(action, request) {
  var payload = {
    'module': 'dns',
    'action': action,
    'safe_drive_dir_key': request.safeDriveKey,
    'app_dir_key': request.appDirKey,
    'safe_drive_access': request.hasSafeDriveAccess || false,
    'data': {}
  };

  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  if (request.params.hasOwnProperty('longName')) {
    payload.data.long_name = request.params.longName;
  }
  if (request.params.hasOwnProperty('serviceName')) {
    payload.data.service_name = request.params.serviceName;
  }
  if (request.params.hasOwnProperty('isPathShared')) {
    payload.data.is_path_shared = request.params.isPathShared;
  }
  if (request.params.hasOwnProperty('serviceHomeDirPath')) {
    payload.data.service_home_dir_path = request.params.serviceHomeDirPath;
  }
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/

  return payload;
};

var getHomeDirectory = function(lib, request) {
  var payload = createPayload('get-home-dir', request);
  util.executeForContent(lib, request.client, request.id, payload);
};

var register = function(lib, request) {
  try {
    var payload = createPayload('register-dns', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendException(request.id, e);
  }
};

var addService = function(lib, request) {
  try {
    var payload = createPayload('add-service', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendException(request.id, e);
  }
};

var getFile = function(lib, request) {
  try {
    var payload = createPayload('get-file', request);
    payload.data.offset = request.params.offset;
    payload.data.length = request.params.length;
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    payload.data.file_path = request.params.filePath;
    payload.data.include_metadata = request.params.includeMetadata;
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.executeForContent(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendException(request.id, e);
  }
};

var getFileMetadata = function(lib, request) {
  try {
    var payload = createPayload('get-file-metadata', request);
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    payload.data.file_path = request.params.filePath;
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
    util.executeForContent(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendException(request.id, e);
  }
};

var deleteDns = function(lib, request) {
  try {
    var payload = createPayload('delete-dns', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendException(request.id, e);
  }
};

var deleteService = function(lib, request) {
  try {
    var payload = createPayload('delete-service', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendException(request.id, e);
  }
};

var listLongNames = function(lib, request) {
  try {
    var payload = createPayload('get-long-names', request);
    util.executeForContent(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendException(request.id, e);
  }
};

var listServices = function(lib, request) {
  try {
    var payload = createPayload('get-services', request);
    util.executeForContent(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendException(request.id, e);
  }
};

var createPublicId = function(lib, request) {
  try {
    var payload = createPayload('register-public-id', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendException(request.id, e);
  }
};

exports.execute = function(lib, request) {
  switch (request.action) {
    case 'get-home-dir':
      getHomeDirectory(lib, request);
      break;
    case 'register-dns':
      register(lib, request);
      break;
    case 'add-service':
      addService(lib, request);
      break;
    case 'get-file':
      getFile(lib, request);
      break;
    case 'get-file-metadata':
      getFileMetadata(lib, request);
      break;
    case 'delete-dns':
      deleteDns(lib, request);
      break;
    case 'delete-service':
      deleteService(lib, request);
      break;
    case 'register-public-id':
      createPublicId(lib, request);
      break;
    case 'get-long-names':
      listLongNames(lib, request);
      break;
    case 'get-services':
      listServices(lib, request);
      break;
    default:
      util.sendException(request.id, new Error('Invalid action'));
  }
};
