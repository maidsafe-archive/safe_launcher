import sessionManager from '../session_manager';
import { ResponseHandler } from '../utils';

var registerOrAddService = function(req, res, isRegister) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  let reqBody = JSON.parse(req.body.toString());
  if (!reqBody.longName) {
    return responseHandler.onResponse('Invalid request. longName can not be empty');
  }
  if (!reqBody.serviceName) {
    return responseHandler.onResponse('Invalid request. serviceName can not be empty');
  }
  if (!reqBody.serviceHomeDirPath) {
    return responseHandler.onResponse('Invalid request. serviceHomeDirPath can not be empty');
  }
  reqBody.isPathShared = reqBody.isPathShared || false;
  if (isRegister) {
    req.app.get('api').dns.register(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      reqBody.isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  } else {
    req.app.get('api').dns.addService(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      reqBody.isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  }
};

export var getHomeDirectory = function(req, res) {
  let sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  let appDirKey = sessionInfo ? sessionInfo.appDirKey : null;
  let hasSafeDriveAccess = sessionInfo ? sessionInfo.hasSafeDriveAccess() : false;
  let longName = req.params.longName;
  let serviceName = req.params.serviceName;
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').dns.getHomeDirectory(longName, serviceName, hasSafeDriveAccess, appDirKey,
    responseHandler.onResponse);
};

export var getFile = function(req, res) {
  let sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  let appDirKey = sessionInfo ? sessionInfo.appDirKey : null;
  var reqParams = req.params;
  let hasSafeDriveAccess = sessionInfo ? sessionInfo.hasSafeDriveAccess() : false;
  let longName = reqParams.longName;
  let serviceName = reqParams.serviceName;
  let filePath = reqParams.filePath;
  let responseHandler = new ResponseHandler(res, sessionInfo, true);
  if (!(longName && serviceName && filePath)) {
    return responseHandler.onResponse('Invalid request. Required parameters are not found');
  }
  let offset = parseInt(req.query.offset) || 0;
  let length = parseInt(req.query.length) || 0;
  req.app.get('api').dns.getFile(longName, serviceName, filePath, offset, length, hasSafeDriveAccess, appDirKey,
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
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let params = req.params;
  let responseHandler = new ResponseHandler(res, sessionInfo);
  if (!(typeof params.longName === 'string')) {
    return responseHandler.onResponse('Invalid request. longName is not valid');
  }
  req.app.get('api').dns.deleteDns(params.longName, sessionInfo.hasSafeDriveAccess(),
    sessionInfo.appDirKey, responseHandler.onResponse);
};

export var deleteService = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let params = req.params;
  let responseHandler = new ResponseHandler(res, sessionInfo);
  if (!(typeof params.serviceName === 'string')) {
    return responseHandler.onResponse('Invalid request. serviceName is not valid');
  }
  if (!(typeof params.longName === 'string')) {
    return responseHandler.onResponse('Invalid request. longName is not valid');
  }
  req.app.get('api').dns.deleteService(params.longName, params.serviceName,
    sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
};

export var listLongNames = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').dns.listLongNames(sessionInfo.appDirKey, responseHandler.onResponse);
};

export var listServices = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').dns.listServices(req.params.longName, sessionInfo.appDirKey, responseHandler.onResponse);
};

export var createPublicId = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').dns.createPublicId(req.params.longName, sessionInfo.appDirKey, responseHandler.onResponse);
};
