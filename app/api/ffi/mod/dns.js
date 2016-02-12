var util = require('./util.js');

var getHomeDirectory = function(lib, request) {
  var payload = {
    'module': 'dns',
    'action': 'get-home-dir',
    'safe_drive_dir_key': request.safeDriveKey,
    'app_dir_key': request.appDirKey,
    'safe_drive_access': request.hasSafeDriveAccess || false,
    'data': {
      'longName': request.params.longName,
      'serviceName': request.params.serviceName
    }
  };
  util.executeForContent(lib, request.client, request.id, payload);
};

exports.execute = function(lib, request) {
  switch (request.action) {
    case 'get-home-dir':
      getHomeDirectory(lib, request);
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
