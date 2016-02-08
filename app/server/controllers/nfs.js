import sessionManager from '../session_manager';

let ResponseHanlder = function(res) {

  let handler = function(err, res) {
    if (err) {
      return res.send(500, err.errorMsg || 'Failed with error code : ' + err.errorCode);
    }
    res.send(201, res || '');
  }

  return handler;
}

export var createDirectory = function(req, res) {
  let sessionInfo = sessionManager.get(req['sessionId']);
  let params = req.body;
  //validate
  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS');
  let appDirKey = sessionInfo.appDirKey;
  req.get('api').nfs.createDirectory(params.dirPath, params.isPrivate, params.isVersioned, params.userMetadata, params.isPathShared, appDirKey, hasSafeDriveAccess, onResponse);
  res.send(200, 'Created');
}

export var deleteDirectory = function(req, res) {
  let sessionInfo = sessionManager.get(req['sessionId']);
  let params = req.params;

  //validate
  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS');
  let appDirKey = sessionInfo.appDirKey;
  req.get('api').nfs.deleteDirectory(params.dirPath, params.isPathShared, appDirKey, hasSafeDriveAccess, onResponse);
  res.send(202, 'Accepted');
}
