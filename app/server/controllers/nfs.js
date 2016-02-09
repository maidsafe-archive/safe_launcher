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
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let params = req.body;
  if (!params.hasOwnProperty('dirPath') || !params.dirPath) {
    return res.status(400).send('Invalid request. dirPath missing');
  }
  params.isPathShared = params.isPathShared || false;
  params.isPrivate = params.isPrivate || true;
  params.isVersioned = params.isVersioned || false;
  params.metadata = params.metadata || '';

  if (typeof params.isVersioned !== 'boolean') {
    return res.status(400).send('Invalid request. isVersioned should be a boolean value');
  }
  let onResponse = function(err) {
    if(!err) {
      return res.status(202).send('Accepted');
    }
    return res.status(500).send(err);
  };
  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS');
  let appDirKey = sessionInfo.appDirKey;
  req.app.get('api').nfs.createDirectory(params.dirPath, params.isPrivate, params.isVersioned,
                                     params.userMetadata, params.isPathShared, appDirKey,
                                     hasSafeDriveAccess, onResponse);
}

export var deleteDirectory = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let params = req.params;

  if (!params.hasOwnProperty('dirPath') || !params.dirPath || !(typeof params.dirPath === 'string')) {
    return res.status(400).send('Invalid request. dirPath missing');
  }
  try {
    params.isPathShared = JSON.parse(params.isPathShared);
  } catch (e) {
    res.status(500).send(e.message)
  }
  if (!params.hasOwnProperty('isPathShared') || !(typeof params.isPathShared === 'boolean')) {
    return res.status(400).send('Invalid request. isPathShared missing');
  }

  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS');
  let appDirKey = sessionInfo.appDirKey;
  let onResponse = function(err) {
    if(!err) {
      return res.status(202).send('Accepted');
    }
    return res.status(500).send(err);
  };
  req.app.get('api').nfs.deleteDirectory(params.dirPath, params.isPathShared, appDirKey, hasSafeDriveAccess, onResponse);
}
