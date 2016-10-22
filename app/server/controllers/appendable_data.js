'use strict';

import sessionManager from '../session_manager';
import {ResponseError, ResponseHandler, updateAppActivity} from '../utils';
import { FILTER_TYPE } from '../../ffi/model/enum';
import appendableData from '../../ffi/api/appendable_data';
import misc from '../../ffi/api/misc';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';
const ID_LENGTH = 32;

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
    if (!payload.name) {
      return next(new ResponseError(400, 'name field is missing'));
    }
    const name = new Buffer(payload.name, 'base64');
    if (name.length !== ID_LENGTH) {
      return next(new ResponseError(400, 'Invalid name field'));
    }
    const isPrivate = payload.isPrivate || false;
    if(typeof isPrivate !== 'boolean') {
      return next(new ResponseError(400, 'Invalid isPrivate field'));
    }
    const filterType = FILTER_TYPE[payload.filterType] || FILTER_TYPE.BLACK_LIST;
    const filterKeys = payload.filterKeys || [];
    const handleId = await appendableData.create(app, name, isPrivate, filterType, filterKeys);
    res.send({
      handleId: handleId
    });
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

export const post = async (req, res, next) => {
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
    const handleId = req.params.handleId;
    await appendableData.save(app, handleId, true);
    responseHandler();
  } catch (e) {
    responseHandler(e);
  }
};

export const put = async (req, res, next) => {
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
    const handleId = req.params.handleId;
    await appendableData.save(app, handleId, false);
    responseHandler();
  } catch (e) {
    responseHandler(e);
  }
};

export const getHandle = async (req, res) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    let app;
    if (sessionInfo) {
      app = sessionInfo.app;
    }
    const handleId = await appendableData.getAppendableDataHandle(app, req.params.dataIdHandle);
    let isOwner = false;
    if (sessionInfo) {
      isOwner = await appendableData.isOwner(app, handleId);
    }
    const version = await appendableData.getVersion(handleId);
    const filterType = await appendableData.getFilterType(handleId);
    const dataLength = await appendableData.getLength(handleId, false);
    const deletedDataLength = await appendableData.getLength(handleId, true);
    res.send({
      handleId: handleId,
      isOwner: isOwner,
      version: version,
      filterType: filterType,
      dataLength: dataLength,
      deletedDataLength: deletedDataLength
    });
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

export const getMetadata = async (req, res) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    let app;
    if (sessionInfo) {
      app = sessionInfo.app;
    }
    const handleId = req.params.handleId;
    let isOwner = false;
    if (sessionInfo) {
      isOwner = await appendableData.isOwner(app, handleId);
    }
    const version = await appendableData.getVersion(handleId);
    const filterType = await appendableData.getFilterType(handleId);
    const dataLength = await appendableData.getLength(handleId, false);
    const deletedDataLength = await appendableData.getLength(handleId, true);
    const filterLength = await appendableData.getFilterLength(handleId);
    const metadata = {
      handleId: handleId,
      isOwner: isOwner,
      version: version,
      filterType: filterType,
      filterLength: filterLength,
      dataLength: dataLength,
      deletedDataLength: deletedDataLength
    };
    responseHandler(null, metadata);
  } catch(e) {
    responseHandler(e);
  }
};

export const isSizeValid = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const isValid = await appendableData.isSizeValid(req.params.handleId);
    responseHandler(null, {
      isValid: isValid
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const getDataIdHandle = async (req, res) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const handleId = await appendableData.asDataId(req.params.handleId);
    responseHandler(null, {
      handleId: handleId
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const getEncryptKey = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const encryptKeyHandle = await appendableData.getEncryptKey(req.params.handleId);
    responseHandler(null, {
      handleId: encryptKeyHandle
    });
  } catch(e) {
    responseHandler(e);
  }
};

const getSignKey = async (req, res, next, fromDeleted) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const app = sessionInfo.app;
    const signingKeyHandle = await appendableData.getSigningKey(app, req.params.handleId, req.params.index, fromDeleted);
    responseHandler(null, {
      handleId: signingKeyHandle
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const getSigningKey = async (req, res, next) => {
  getSignKey(req, res, next, false);
};

export const getSigningKeyFromDeletedData = async (req, res, next) => {
  getSignKey(req, res, next, true);
};

export const append = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
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
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

const dataIdAt = async (req, res, fromDeleted) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    const handleId = await appendableData.getDataId(app, req.params.handleId, req.params.index, fromDeleted);
    responseHandler(null, {
      handleId: handleId
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const getDataIdAt = (req, res) => {
  dataIdAt(req, res, false);
};

export const getDeletedDataIdAt = async (req, res) => {
  dataIdAt(req, res, true);
};

export const toggleFilter = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.toggleFilter(req.params.handleId);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const addToFilter = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const keys = req.body;
    for (let key of keys) {
      await appendableData.insertToFilter(req.params.handleId, key);
    }
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const removeFromFilter = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const keys = req.body;
    for (let key of keys) {
      await appendableData.removeFromFilter(req.params.handleId, key);
    }
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const getSignKeyFromFilter = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const signKeyHandle = await appendableData.getSignKeyFromFilter(req.params.handleId, req.params.index);
    responseHandler(null, {
      handleId: signKeyHandle
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const remove = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.removeDataAt(req.params.handleId, req.params.index, false);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const removeDeletedData = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.removeDataAt(req.params.handleId, req.params.index, true);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const clearData = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.clearAll(req.params.handleId, false);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const clearDeletedData = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.clearAll(req.params.handleId, true);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const dropEncryptKeyHandle = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await misc.dropEncryptKeyHandle(req.params.handleId);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const dropSigningKeyHandle = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await misc.dropSignKeyHandle(req.params.handleId);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const deleteAppendableData = async (req, res) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.delete(sessionInfo.app, req.params.handleId);
    responseHandler();
  } catch (e) {
    responseHandler(e);
  }
};

export const restore = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    if (isNaN(req.params.index)) {
      return next(new ResponseError(400, 'index must be a valid number'));
    }
    await appendableData.restore(req.params.handleId, parseInt(req.params.index));
    responseHandler();
  } catch (e) {
    responseHandler(e);
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
    const data = await appendableData.serialise(req.params.handleId);
    res.send(data);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

export const deserialise = async (req, res) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const handleId = await appendableData.deserialise(req.rawBody);
    const isOwner = await appendableData.isOwner(app, handleId);
    const version = await appendableData.getVersion(handleId);
    const filterType = await appendableData.getFilterType(handleId);
    const dataLength = await appendableData.getLength(handleId, false);
    const deletedDataLength = await appendableData.getLength(handleId, true);
    responseHandler(null, {
      handleId: handleId,
      isOwner: isOwner,
      version: version,
      filterType: filterType,
      dataLength: dataLength,
      deletedDataLength: deletedDataLength
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const serialiseSignKey = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const data = await misc.serialiseSignKey(req.params.handleId);
    responseHandler(null, data);
  } catch(e) {
    responseHandler(e);
  }
};

export const deserialiseSignKey = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const handleId = await misc.deserialiseSignKey(req.rawBody);
    responseHandler(null, {
      handleId
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const dropHandle = async (req, res) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    await appendableData.dropHandle(req.params.handleId);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};
