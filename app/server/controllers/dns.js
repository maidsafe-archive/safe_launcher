import sessionManager from '../session_manager';
import { formatResponse, ResponseHandler } from '../utils';

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
  try {
    reqBody.isPathShared = JSON.parse(reqBody.isPathShared);
  } catch (e) {
    res.status(500).send(e.toString())
  }
  if (!reqBody.hasOwnProperty('isPathShared') || !(typeof reqBody.isPathShared === 'boolean')) {
    return res.status(400).send('Invalid request. isPathShared missing');
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  if (isRegister) {
    req.app.get('api').dns.register(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      reqBody.isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  } else {
    req.app.get('api').dns.addService(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      reqBody.isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  }
};

export var register = function(req, res) {
  registerOrAddService(req, res, true);
};

export var addService = function(req, res) {
  registerOrAddService(req, res, false);
};
