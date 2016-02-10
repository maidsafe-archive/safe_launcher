import sessionManager from '../session_manager';

let deleteOrGetDirectory = function(req, res, isDelete) {
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

  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS') !== -1;
  let appDirKey = sessionInfo.appDirKey;
  let onResponse = function(err, data) {
    if (!err) {
      let status = data ? 200 : 202;
      return res.status(status).send(data || 'Accepted');
    }
    return res.status(500).send(err);
  };
  let nfsApi = req.app.get('api').nfs;
  var execFunc = (isDelete ? nfsApi.deleteDirectory : nfsApi.getDirectory);
  execFunc(params.dirPath, params.isPathShared, appDirKey, hasSafeDriveAccess, onResponse);
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
    if (!err) {
      return res.status(202).send('Accepted');
    }
    return res.status(500).send(err);
  };
  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS') !== -1;
  let appDirKey = sessionInfo.appDirKey;
  req.app.get('api').nfs.createDirectory(params.dirPath, params.isPrivate, params.isVersioned,
    params.metadata, params.isPathShared, appDirKey,
    hasSafeDriveAccess, onResponse);
}

export var deleteDirectory = function(req, res) {
  deleteOrGetDirectory(req, res, true);
}

export var getDirectory = function(req, res) {
  deleteOrGetDirectory(req, res, false);
};

export var modifyDirectory = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let reqBody = req.body;
  let params = req.params;

  if (!params.hasOwnProperty('dirPath') || !params.dirPath) {
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

  if (!reqBody.hasOwnProperty('name') || !reqBody.name) {
    return res.status(400).send('Invalid request. Directory name to be changed missing');
  }

  reqBody.metadata = reqBody.metadata || '';
  let onResponse = function(err) {
    if (!err) {
      return res.status(202).send('Accepted');
    }
    return res.status(500).send(err);
  };
  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS') !== -1;
  let appDirKey = sessionInfo.appDirKey;
  req.app.get('api').nfs.modifyDirectory(reqBody.name, params.dirPath, reqBody.metadata, params.isPathShared, appDirKey,
    hasSafeDriveAccess, onResponse);
};

export var createFile = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let reqBody = req.body;
  if (!reqBody.hasOwnProperty('filePath') || !reqBody.filePath) {
    return res.status(400).send('Invalid request. filePath missing');
  }
  reqBody.isPathShared = reqBody.isPathShared || false;
  reqBody.metadata = reqBody.metadata || '';
  let onResponse = function(err) {
    if (!err) {
      return res.status(202).send('Accepted');
    }
    return res.status(500).send(err);
  };
  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS') !== -1;
  let appDirKey = sessionInfo.appDirKey;
  req.app.get('api').nfs.createFile(reqBody.filePath, reqBody.metadata, reqBody.isPathShared, appDirKey,
    hasSafeDriveAccess, onResponse);
};
