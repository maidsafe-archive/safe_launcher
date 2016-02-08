var ref = require('ref');
var clientHandle = ref.types.void;
var clientHandlePtr = ref.refType(clientHandle);
var clientHandlePtrPtr = ref.refType(clientHandlePtr);

var util = require('./util.js');

var createDirectory = function(lib, request) {
  try {
    var params = {
      'module': 'nfs',
      'action': 'create-dir',
      'safe_drive_dir_key': request.safeDriveKey,
      'app_dir_key': request.appDirKey,
      'safe_drive_access': request.hasSafeDriveAccess || false,
      'data': {
        'dir_path': request.params.dirPath,
        'is_private': request.params.isPrivate,
        'is_versioned': request.params.isVersioned,
        'user_metadata': request.params.userMetadata,
        'is_path_shared': request.params.isPathShared
      }
    };
    var result = lib.execute(JSON.stringify(params), request.client);
    if (result === 0) {
      return util.send(request.id, true);
    }
    util.sendError(request.id, result);
  } catch (e) {
    util.sendError(request.id, 999, e.message());
  }
};

exports.execute = function(clientHandle, lib, request) {
  switch (request.action) {
    case 'create-dir':
      createDirectory(lib, request);
      break;
    default:
      util.sendError(request.id, 999, 'Invalid Action');
  }
};
