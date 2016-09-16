import sessionManager from '../session_manager';
import {ResponseError, ResponseHandler, updateAppActivity} from '../utils';
import { FILTER_TYPE } from '../../ffi/model/enum';
import appendableData from '../../ffi/api/appendable_data';
import dataId from '../../ffi/api/data_id';
import misc from '../../ffi/api/misc';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';
const HANDLE_ID_KEY = 'Handle-Id';
const ID_LENGTH = 32;

// post /
export const create = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const payload = req.body;
    if (!payload.id) {
      return next(new ResponseError(400, 'id field is missing'));
    }
    const id = new Buffer(payload.id, 'base64');
    if (id.length !== ID_LENGTH) {
      return next(new ResponseError(400, 'Invalid id'));
    }
    const isPrivate = payload.isPrivate || false;
    const filterType = FILTER_TYPE[payload.filterType] || FILTER_TYPE.BLACK_LIST;
    const filterKeys = payload.filterKeys || [];
    const dataIdHandle = await appendableData.create(app, id, isPrivate, filterType, filterKeys);
    res.set('Handle-Id', dataIdHandle);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

// GET /id
export const getHandle = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    let isPrivate = false;
    if (req.headers.hasOwnProperty('is-private')) {
      isPrivate = (req.headers['is-private'].toLowerCase() === 'true');
    }
    if (!sessionInfo && isPrivate) {
      return next(new ResponseError(401, 'Unauthorised request cannot access private data'));
    }
    let app;
    if (sessionInfo) {
      app = sessionInfo.app;
    }
    const id = new Buffer(req.params.id, 'base64');
    if (id.length !== ID_LENGTH) {
      return next(new ResponseError(400, 'Invalid id'));
    }
    const dataIdHandle = await dataId.getAppendableDataHandle(id, isPrivate);
    res.set('Handle-Id', dataIdHandle);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

// HEAD /handleId
export const getMetadata = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    const length = await appendableData.getLength(app, req.params.handleId);
    res.set('Data-Length', length);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

// GET /encryptKey/handleId
export const getEncryptKey = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const app = sessionInfo.app;
    const encryptKeyHandle = await appendableData.getEncryptKey(app, req.params.handleId);
    res.set('Handle-Id', encryptKeyHandle);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

// PUT /hanldeId/dataHandleId
export const append = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const app = sessionInfo.app;
    await appendableData.append(app, req.params.handleId, req.params.dataIdHandle);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

// GET /id/at
export const getDataIdAt = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const dataIdHandle = await appendableData.getDataIdFrom(sessionInfo.app, req.params.handleId, req.params.index);
    res.set('Handle-Id', dataIdHandle);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

// DELETE /id/at
export const remove = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.removeFrom(sessionInfo.app, req.params.handleId, req.params.index);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

export const clearDeletedData = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.clearAllDeletedData(sessionInfo.app, req.params.handleId);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

// DELETE /encryptKey/id
export const dropEncryptKeyHandle = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await misc.dropEncryptKeyHandle(req.params.handleId);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

export const serialise = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const data = await appendableData.serialise(sessionInfo.app, req.params.handleId);
    res.send(data);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};
