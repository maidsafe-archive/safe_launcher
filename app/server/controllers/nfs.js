import sessionManager from '../session_manager';
import { formatResponse } from '../utils';

let deleteOrGetDirectory = function(req, res, isDelete) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let params = req.params;

  if (!params.hasOwnProperty('dirPath') || !params.dirPath || !(typeof params.dirPath === 'string')) {
    return res.status(400).send('Invalid request. dirPath missing');
  }
  try {
    params.isPathShared = JSON.parse(params.isPathShared);
  } catch (e) {
    res.status(500).send(e.toString());
  }
  if (!params.hasOwnProperty('isPathShared') || !(typeof params.isPathShared === 'boolean')) {
    return res.status(400).send('Invalid request. isPathShared missing');
  }

  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS') !== -1;
  let appDirKey = sessionInfo.appDirKey;
  let onResponse = function(err, data) {
    if (!err) {
      let status = data ? 200 : 202;
      return res.status(status).send(formatResponse(data) || 'Accepted');
    }
    return res.status(500).send(err);
  };
  if (isDelete) {
    req.app.get('api').nfs.deleteDirectory(params.dirPath, params.isPathShared,
      sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, onResponse);
  } else {
    req.app.get('api').nfs.getDirectory(params.dirPath, params.isPathShared,
      sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, onResponse);
  }
}

export var createDirectory = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let params = JSON.parse(req.body.toString());
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
    params.metadata, params.isPathShared,
    sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, onResponse);
}

export var deleteDirectory = function(req, res) {
  deleteOrGetDirectory(req, res, true);
}

export var getDirectory = function(req, res) {
  deleteOrGetDirectory(req, res, false);
};

export var modifyDirectory = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.status(401).send('Unauthorised');
  }
  let reqBody = JSON.parse(req.body.toString());
  let params = req.params;
  if (!params.dirPath) {
    return res.status(400).send('Invalid request. dirPath missing');
  }
  try {
    params.isPathShared = JSON.parse(params.isPathShared);
  } catch (e) {
    res.status(500).send(e.toString())
  }

  if (!params.hasOwnProperty('isPathShared') || !(typeof params.isPathShared === 'boolean')) {
    return res.status(400).send('Invalid request. isPathShared missing');
  }

  reqBody.name = reqBody.name || null;
  reqBody.metadata = reqBody.metadata || null;

  if (!reqBody.name && !reqBody.metadata) {
    return res.status(400).send('Invalid request. Name or metadata should be present in the request');
  }

  let onResponse = function(err) {
    if (!err) {
      return res.status(202).send('Accepted');
    }
    return res.status(500).send(err);
  };
  req.app.get('api').nfs.modifyDirectory(reqBody.name, reqBody.metadata, params.dirPath, params.isPathShared,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), onResponse);
};

export var createFile = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.status(401).send('Unauthorised');
  }
  let reqBody = JSON.parse(req.body.toString());
  if (!reqBody.filePath) {
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
  req.app.get('api').nfs.createFile(reqBody.filePath, reqBody.metadata, reqBody.isPathShared,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), onResponse);
};

export var deleteFile = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.status(401).send('Unauthorised');
  }
  let params = req.params;
  if (!params.filePath) {
    return res.status(400).send('Invalid request. filePath missing');
  }
  try {
    params.isPathShared = JSON.parse(params.isPathShared);
  } catch (e) {
    res.status(500).send(e.message);
  }
  if (!params.hasOwnProperty('isPathShared') || !(typeof params.isPathShared === 'boolean')) {
    return res.status(400).send('Invalid request. isPathShared missing');
  }
  let onResponse = function(err) {
    if (!err) {
      return res.status(202).send('Accepted');
    }
    return res.status(500).send(err);
  };
  req.app.get('api').nfs.deleteFile(params.filePath, params.isPathShared, sessionInfo.appDirKey,
    sessionInfo.hasSafeDriveAccess(), onResponse);
};

export var modifyFileMeta = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.status(401).send('Unauthorised');
  }
  let params = req.params;
  let reqBody = JSON.parse(req.body.toString());
  if (!params.filePath) {
    return res.status(400).send('Invalid request. filePath missing');
  }
  try {
    params.isPathShared = JSON.parse(params.isPathShared);
  } catch (e) {
    res.status(400).send('isPathShared field should be present and should be a boolean value');
  }
  if (!params.hasOwnProperty('isPathShared') || !(typeof params.isPathShared === 'boolean')) {
    return res.status(400).send('Invalid request. isPathShared missing');
  }
  reqBody.metadata = reqBody.metadata || null;
  reqBody.name = reqBody.name || null;
  let onResponse = function(err) {
    if (!err) {
      return res.status(202).send('Accepted');
    }
    return res.status(500).send(err);
  };
  req.app.get('api').nfs.modifyFileMeta(reqBody.name, reqBody.metadata, params.filePath, params.isPathShared,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), onResponse);
};

export var getFile = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.status(401).send('Unauthorised');
  }
  let offset = req.query.offset || 0;
  let length = req.query.length || 0;
  let onResponse = function(err, data) {
    if (!err) {
      let status = data ? 200 : 202;
      return res.status(status).send(formatResponse(data) || 'Accepted');
    }
    return res.status(500).send(err);
  };
  let hasSafeDriveAccess = sessionInfo.permissions.indexOf('SAFE_DRIVE_ACCESS') !== -1;
  let appDirKey = sessionInfo.appDirKey;
  req.app.get('api').nfs.getFile(req.params.filePath, req.params.isPathShared, offset, length,
    appDirKey, hasSafeDriveAccess, onResponse);
};

export var modifyFileContent = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let params = req.params;
  let reqBody = req.body.toString('base64');
  if (!params.filePath) {
    return res.status(400).send('Invalid request. filePath missing');
  }
  try {
    params.isPathShared = JSON.parse(params.isPathShared);
  } catch (e) {
    res.status(500).send(e.toString());
  }
  if (!params.hasOwnProperty('isPathShared') || !(typeof params.isPathShared === 'boolean')) {
    return res.status(400).send('Invalid request. isPathShared missing');
  }
  if (!reqBody) {
    return res.status(400).send('Invalid request. content missing or should be valid');
  }
  params.offset = params.offset || 0;
  let onResponse = function(err) {
    if (!err) {
      return res.status(202).send('Accepted');
    }
    return res.status(500).send(err);
  };
  req.app.get('api').nfs.modifyFileContent(reqBody, params.offset, params.filePath, params.isPathShared,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), onResponse);
};
