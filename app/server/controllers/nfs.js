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
  if (!(params.dirPath)) {
    return res.status(400).('Invalid request. dirPath missing');
  }
  params.isPathShared = params.isPathShared || false;
  params.isPrivate = params.isPrivate || true;
  params.isVersioned = params.isVersioned || false;
  params.metadata = params.metadata || '';

  if (typeOf(params.isVersioned) !== 'boolean') {
    return res.status(400).('Invalid request. isVersioned should be a boolean value');
  }

  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS');
  let appDirKey = sessionInfo.appDirKey;
  req.get('api').nfs.createDirectory(params.dirPath, params.isPrivate, params.isVersioned,
                                     params.userMetadata, params.isPathShared, appDirKey,
                                     hasSafeDriveAccess, onResponse);
  res.status(202).send('Accepted');
}
