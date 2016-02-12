import sessionManager from '../session_manager';
import { ResponseHandler } from '../utils';

export var getHomeDirectory = function(req, res) {
  let sessionInfo = req.headers['sessionId'] ? sessionManager.get(res.headers['sessionId']) : null;
  let appDirKey = sessionInfo ? sessionInfo.appDirKey : null;
  let hasSafeDriveAccess = sessionInfo ? sessionInfo.hasSafeDriveAccess() : false;
  let longName = req.params.longName;
  let serviceName = req.params.serviceName;
  if (!(longName && serviceName)) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res, sessionInfo);
  req.app.get('api').dns.getHomeDirectory(longName, serviceName, hasSafeDriveAccess, appDirKey,
    responseHandler.onResponse);
};
