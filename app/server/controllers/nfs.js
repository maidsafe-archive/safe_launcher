import sessionManager from '../session_manager';
import { ResponseHandler } from '../utils';

let deleteOrGetDirectory = function(req, res, isDelete) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let params = req.params;

  if (!params.hasOwnProperty('dirPath') || !params.dirPath || !(typeof params.dirPath === 'string')) {
    return res.status(400).send('Invalid request. dirPath missing');
  }
  params.isPathShared = params.isPathShared || false;
  try {
    params.isPathShared = JSON.parse(params.isPathShared);
  } catch (e) {
    return res.status(400).send('Invalid request. isPathShared invalid');
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  if (isDelete) {
    req.app.get('api').nfs.deleteDirectory(params.dirPath, params.isPathShared,
      sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  } else {
    req.app.get('api').nfs.getDirectory(params.dirPath, params.isPathShared,
      sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  }
}

export var createDirectory = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let params = JSON.parse(req.body.toString());
  if (!params.hasOwnProperty('dirPath') || !params.dirPath) {
    return res.status(400).send('Invalid request. dirPath missing');
  }
  if (!params.hasOwnProperty('isPrivate')) {
    params.isPrivate = false;
  }
  params.isPathShared = params.isPathShared || false;
  params.isVersioned = params.isVersioned || false;
  params.metadata = params.metadata || '';

  if (typeof params.isVersioned !== 'boolean') {
    return res.status(400).send('Invalid request. isVersioned should be a boolean value');
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);;
  let appDirKey = sessionInfo.appDirKey;
  req.app.get('api').nfs.createDirectory(params.dirPath, params.isPrivate, params.isVersioned,
    params.metadata, params.isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey,
    responseHandler.onResponse);
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
  params.isPathShared =JSON.parse(params.isPathShared) || false;
  reqBody.name = reqBody.name || null;
  reqBody.metadata = reqBody.metadata || null;

  if (!reqBody.name && !reqBody.metadata) {
    return res.status(400).send('Invalid request. Name or metadata should be present in the request');
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').nfs.modifyDirectory(reqBody.name, reqBody.metadata, params.dirPath, params.isPathShared,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), responseHandler.onResponse);
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
  let responseHandler = new ResponseHandler(res, sessionInfo);;
  req.app.get('api').nfs.createFile(reqBody.filePath, reqBody.metadata, reqBody.isPathShared,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), responseHandler.onResponse);
};

export var deleteFile = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.status(401).send('Unauthorised');
  }
  let params = req.params;
  if (!(typeof params.filePath === 'string')) {
    return res.status(400).send('Invalid request. filePath is not valid');
  }
  params.isPathShared = JSON.parse(params.isPathShared) || false;
  let responseHandler = new ResponseHandler(res, sessionInfo);;
  req.app.get('api').nfs.deleteFile(params.filePath, params.isPathShared, sessionInfo.appDirKey,
    sessionInfo.hasSafeDriveAccess(), responseHandler.onResponse);
};

export var modifyFileMeta = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.status(401).send('Unauthorised');
  }
  let params = req.params;
  let reqBody = JSON.parse(req.body.toString());
  if (!(typeof params.filePath === 'string')) {
    return res.status(400).send('Invalid request. filePath is not valid');
  }
  params.isPathShared = JSON.parse(params.isPathShared) || false;
  reqBody.metadata = reqBody.metadata || null;
  reqBody.name = reqBody.name || null;
  let responseHandler = new ResponseHandler(res, sessionInfo);;
  req.app.get('api').nfs.modifyFileMeta(reqBody.name, reqBody.metadata, params.filePath, params.isPathShared,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), responseHandler.onResponse);
};

export var getFile = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.status(401).send('Unauthorised');
  }
  let params = req.params;
  if (!(typeof params.filePath === 'string')) {
    return res.status(400).send('Invalid request. filePath is not valid');
  }
  params.isPathShared = JSON.parse(params.isPathShared) || false;
  let offset = req.query.offset || 0;
  let length = req.query.length || 0;
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').nfs.getFile(params.filePath, params.isPathShared, offset, length,
    sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey,responseHandler.onResponse);
};

export var modifyFileContent = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.status(401).send('Unauthorised');
  }
  let params = req.params;
  let reqBody = req.body.toString('base64');
  let query = req.query;

  if (!(typeof params.filePath === 'string')) {
    return res.status(400).send('Invalid request. filePath is not valid');
  }
  params.isPathShared = JSON.parse(params.isPathShared) || false;
  if (!reqBody) {
    return res.status(400).send('Invalid request. content missing or should be valid');
  }
  query.offset = query.offset || 0;
  let responseHandler = new ResponseHandler(res, sessionInfo);;
  req.app.get('api').nfs.modifyFileContent(reqBody, query.offset, params.filePath, params.isPathShared,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), responseHandler.onResponse);
};
