import sessionManager from '../session_manager';
import { ResponseHandler } from '../utils';

var registerOrAddService = function(req, res, isRegister) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let reqBody = JSON.parse(req.body.toString());
  if (!reqBody.longName) {
    return res.status(400).send('Invalid request. longName missing');
  }
  if (!reqBody.serviceName) {
    return res.status(400).send('Invalid request. serviceName missing');
  }
  if (!reqBody.serviceHomeDirPath) {
    return res.status(400).send('Invalid request. serviceHomeDirPath missing');
  }
  reqBody.isPathShared = reqBody.isPathShared || false;
  let responseHandler = new ResponseHandler(res, sessionInfo);
  if (isRegister) {
    req.app.get('api').dns.register(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      reqBody.isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  } else {
    req.app.get('api').dns.addService(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      reqBody.isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  }
};

export var getHomeDirectory = function(req, res) {
  let sessionInfo = req.headers['sessionId'] ? sessionManager.get(res.headers['sessionId']) : null;
  let appDirKey = sessionInfo ? sessionInfo.appDirKey : null;
  let hasSafeDriveAccess = sessionInfo ? sessionInfo.hasSafeDriveAccess() : false;
  let longName = req.params.longName;
  let serviceName = req.params.serviceName;
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').dns.getHomeDirectory(longName, serviceName, hasSafeDriveAccess, appDirKey,
    responseHandler.onResponse);
};

export var getFile = function(req, res) {
  let sessionInfo = req.headers['sessionId'] ? sessionManager.get(res.headers['sessionId']) : null;
  let appDirKey = sessionInfo ? sessionInfo.appDirKey : null;
  var reqParams = req.params;
  let hasSafeDriveAccess = sessionInfo ? sessionInfo.hasSafeDriveAccess() : false;
  let longName = reqParams.longName;
  let serviceName = reqParams.serviceName;
  let filePath = reqParams.filePath;
  if (!(longName && serviceName && filePath)) {
    return res.status(400).send('Required parameter(s) missing');
  }
  let offset = req.query.offset || 0;
  let length = req.query.length || 0;
  let responseHandler = new ResponseHandler(res, sessionInfo, true);
  req.app.get('api').dns.getFile(longName, serviceName, filePath, offset, length, asSafeDriveAccess, appDirKey,
    responseHandler.onResponse);
};

export var register = function(req, res) {
  registerOrAddService(req, res, true);
};

export var addService = function(req, res) {
  registerOrAddService(req, res, false);
};

export var deleteDns = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let params = req.params;
  if (!(typeof params.longName === 'string')) {
    return res.status(400).send('Invalid request. longName is not valid');
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').dns.deleteDns(params.longName, sessionInfo.hasSafeDriveAccess(),
    sessionInfo.appDirKey, responseHandler.onResponse);
};

export var deleteService = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  let params = req.params;
  if (!(typeof params.serviceName === 'string')) {
    return res.status(400).send('Invalid request. serviceName is not valid');
  }
  if (!(typeof params.longName === 'string')) {
    return res.status(400).send('Invalid request. longName is not valid');
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').dns.deleteService(params.longName, params.serviceName,
    sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
};
