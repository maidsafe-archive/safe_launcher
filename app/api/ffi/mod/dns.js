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

var register = function(lib, request) {
  try {
    var payload = createPayload('register-dns', request);
    util.send(999, 'payload');
    util.execute(lib, request.client, request.id, payload);
  } catch (e) {
    util.sendError(request.id, 999, e.toString());
  }
};

exports.execute = function(lib, request) {
  switch (request.action) {
    case 'register-dns':
      register(lib, request);
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
