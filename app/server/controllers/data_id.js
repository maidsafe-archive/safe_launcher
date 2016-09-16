import sessionManager from '../session_manager';
import {ResponseError, ResponseHandler, updateAppActivity} from '../utils';
import misc from '../../ffi/api/misc';
import dataId from '../../ffi/api/data_id';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';
const HANDLE_ID_KEY = 'Handle-Id';

export const serialise = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const data = await misc.serialiseDataId(req.params.handleId);
    res.send(data);
    updateAppActivity(req, res, true);
  } catch(e) {
    responseHandler(e);
  }
};

export const deserialise = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    if (!req.rawBody || req.rawBody.length === 0) {
      return next(new ResponseError(400, 'Body can not be empty'));
    }
    const dataHandle = await misc.deserialiseDataId(req.rawBody);
    res.set('Handle-Id', dataHandle);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    console.error(e);
    responseHandler(e);
  }
};

export const dropHandle = (req, res, next) => {
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401, UNAUTHORISED_ACCESS));
  }
  const app = sessionInfo.app;
  if (!app.permission.lowLevelApi) {
    return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
  }
  const responseHandler = new ResponseHandler(req, res);
  dataId.dropHandle(req.params.handleId)
    .then(responseHandler, responseHandler, console.error);
  res.sendStatus(200);
  updateAppActivity(req, res, true);
};
