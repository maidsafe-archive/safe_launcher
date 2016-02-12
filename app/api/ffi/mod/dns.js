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
  var payload = createPayload(request);
  util.executeForContent(lib, request.client, request.id, payload);
};

var register = function(lib, request) {
  try {
    var payload = createPayload('register-dns', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var addService = function(lib, request) {
  try {
    var payload = createPayload('add-service', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var deleteDns = function(lib, request) {
  try {
    var payload = createPayload('delete-dns', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

var deleteService = function(lib, request) {
  try {
    var payload = createPayload('delete-service', request);
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

exports.execute = function(lib, request) {
  switch (request.action) {
    case 'get-home-dir':
      getHomeDirectory(lib, request);
    case 'register-dns':
      register(lib, request);
      break;
    case 'add-service':
      addService(lib, request);
      break;
    case 'delete-dns':
      deleteDns(lib, request);
      break;
    case 'delete-service':
      deleteService(lib, request);
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
