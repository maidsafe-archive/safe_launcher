'use strict';

import sessionManager from '../session_manager';
import { ResponseError, ResponseHandler, updateAppActivity, parseExpectionMsg } from '../utils';
import { FILTER_TYPE } from '../../ffi/model/enum';
import appendableData from '../../ffi/api/appendable_data';
import misc from '../../ffi/api/misc';
import { log } from '../../logger/log';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';
const ID_LENGTH = 32;

export const create = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Create`);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Create :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Create :: Low level access not granted`);
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
    if (typeof isPrivate !== 'boolean') {
      return next(new ResponseError(400, 'Invalid isPrivate field'));
    }
    const filterType = FILTER_TYPE[payload.filterType] || FILTER_TYPE.BLACK_LIST;
    const filterKeys = payload.filterKeys || [];
    const handleId = await appendableData.create(app, name, isPrivate, filterType, filterKeys);
    log.debug(`Appendable data - ${req.id} :: Created new appendable data`);
    res.send({
      handleId: handleId
    });
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Create error :: ${parseExpectionMsg(e)}`);
    new ResponseHandler(req, res)(e);
  }
};

export const post = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Post`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Post :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Post :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const handleId = req.params.handleId;
    await appendableData.save(app, handleId, true);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Post error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const put = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Put`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Put :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Put :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const handleId = req.params.handleId;
    await appendableData.save(app, handleId, false);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Put error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getHandle = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Get handle`);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    let app;
    if (sessionInfo) {
      app = sessionInfo.app;
    }
    log.debug(`Appendable data - ${req.id} :: Get handle :: ${ app ? 'Authorised' : 'Unauthorised'} request`);
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
    log.debug(`Appendable data - ${req.id} :: Got appendable data handle`);
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get handle error :: ${parseExpectionMsg(e)}`);
    new ResponseHandler(req, res)(e);
  }
};

export const getMetadata = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Get metadata`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    let app;
    if (sessionInfo) {
      app = sessionInfo.app;
    }
    log.debug(`Appendable data - ${req.id} :: Get metadata :: ${ app ? 'Authorised' : 'Unauthorised'} request`);
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
    log.debug(`Appendable data - ${req.id} :: Got appendable data metadata`);
    responseHandler(null, metadata);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get metadata error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const isSizeValid = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Check size valid`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const isValid = await appendableData.isSizeValid(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Check size valid :: isValid - ${isValid}`);
    responseHandler(null, {
      isValid: isValid
    });
  } catch (e) {
    responseHandler(e);
  }
};

export const getDataIdHandle = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Get Data ID handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const handleId = await appendableData.asDataId(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Got Data ID handle`);
    responseHandler(null, {
      handleId: handleId
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get Data ID handle error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getEncryptKey = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Get encrypt key handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Get encrypt key handle :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Get encrypt key handle :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const encryptKeyHandle = await appendableData.getEncryptKey(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Got encrypt key handle`);
    responseHandler(null, {
      handleId: encryptKeyHandle
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get encrypt key handle error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

const getSignKey = async(req, res, next, fromDeleted) => {
  log.debug(`Appendable data - ${req.id} :: Get sign key handle ${fromDeleted ? 'from deleted data' : ''}`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Get sign key handle ${fromDeleted ? 'from deleted data' : ''} :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Get sign key handle ${fromDeleted ? 'from deleted data' : ''} :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const app = sessionInfo.app;
    const signingKeyHandle = await appendableData.getSigningKey(app, req.params.handleId, req.params.index, fromDeleted);
    log.debug(`Appendable data - ${req.id} :: Got sign key handle ${fromDeleted ? 'from deleted data' : ''}`);
    responseHandler(null, {
      handleId: signingKeyHandle
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get sign key handle ${fromDeleted ? 'from deleted data' : ''} error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getSigningKey = async(req, res, next) => {
  getSignKey(req, res, next, false);
};

export const getSigningKeyFromDeletedData = async(req, res, next) => {
  getSignKey(req, res, next, true);
};

export const append = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Append`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Append :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Append :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const app = sessionInfo.app;
    await appendableData.append(app, req.params.handleId, req.params.dataIdHandle);
    log.debug(`Appendable data - ${req.id} :: Appended data to Appendable data`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Append error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

const dataIdAt = async(req, res, fromDeleted) => {
  log.debug(`Appendable data - ${req.id} :: Get Data ${ fromDeleted ? 'from deleted data' : '' } at index`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Appendable data - ${req.id} :: Get Data ${ fromDeleted ? 'from deleted data' : '' } at index :: ${ app ? 'Authorised' : 'Unauthorised'} request`);
    const handleId = await appendableData.getDataId(app, req.params.handleId, req.params.index, fromDeleted);
    log.debug(`Appendable data - ${req.id} :: Got Data ${ fromDeleted ? 'from deleted data' : '' } at index - ${req.params.index}`);
    responseHandler(null, {
      handleId: handleId
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get Data ${ fromDeleted ? 'from deleted data' : '' } at index error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getDataIdAt = (req, res) => {
  dataIdAt(req, res, false);
};

export const getDeletedDataIdAt = async(req, res) => {
  dataIdAt(req, res, true);
};

export const toggleFilter = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Toggle filter`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Toggle filter :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Toggle filter :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.toggleFilter(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Toggled filter`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Toggled filter error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const addToFilter = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Add to filter`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Add to filter :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Add to filter :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const keys = req.body;
    for (let key of keys) {
      await appendableData.insertToFilter(req.params.handleId, key);
    }
    log.debug(`Appendable data - ${req.id} :: Added ${keys.length} keys to filter`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Add to filter error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const removeFromFilter = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Remove from filter`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Remove from filter :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Remove from filter :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const keys = req.body;
    for (let key of keys) {
      await appendableData.removeFromFilter(req.params.handleId, key);
    }
    log.debug(`Appendable data - ${req.id} :: Removed ${keys.length} keys from filter`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Remove from filter error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getSignKeyFromFilter = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Get sign key from filter`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Get sign key from filter :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Get sign key from filter :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const signKeyHandle = await appendableData.getSignKeyFromFilter(req.params.handleId, req.params.index);
    log.debug(`Appendable data - ${req.id} :: Got sign key from filter at index - ${req.params.index}`);
    responseHandler(null, {
      handleId: signKeyHandle
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get sign key from filter error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const remove = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Remove at`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Remove at :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Remove at :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.removeDataAt(req.params.handleId, req.params.index, false);
    log.debug(`Appendable data - ${req.id} :: Removed at index - ${req.params.index}`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Remove at - error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const removeDeletedData = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Remove deleted data at`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Remove deleted data at :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Remove deleted data at :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.removeDataAt(req.params.handleId, req.params.index, true);
    log.debug(`Appendable data - ${req.id} :: Removed deleted data at index - ${req.params.index}`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Remove deleted data at - error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const clearData = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Clear data`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Clear data :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Clear data :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.clearAll(req.params.handleId, false);
    log.debug(`Appendable data - ${req.id} :: Cleared data`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Clear data error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const clearDeletedData = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Clear deleted data`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Clear deleted data :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Clear deleted data :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.clearAll(req.params.handleId, true);
    log.debug(`Appendable data - ${req.id} :: Cleared deleted data`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Clear deleted data error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const dropEncryptKeyHandle = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Drop encrypt key handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Drop encrypt key handle :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Drop encrypt key handle :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await misc.dropEncryptKeyHandle(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Dropped encrypt key handle`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Drop encrypt key handle error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const dropSigningKeyHandle = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Drop signing key handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Drop signing key handle :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Drop signing key handle :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await misc.dropSignKeyHandle(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Dropped signing key handle`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Drop signing key handle error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deleteAppendableData = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Delete`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Delete :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Delete :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.delete(sessionInfo.app, req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Deleted appendable data`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Delete error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const restore = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Restore`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Restore :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Restore :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    if (isNaN(req.params.index)) {
      return next(new ResponseError(400, 'index must be a valid number'));
    }
    await appendableData.restore(req.params.handleId, parseInt(req.params.index));
    log.debug(`Appendable data - ${req.id} :: Restored appendable data at index - ${req.params.index}`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Restored error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const serialise = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Serialise`);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Serialise :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Serialise :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const data = await appendableData.serialise(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Serialised appendable data handle`);
    res.send(data);
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Serialise error :: ${parseExpectionMsg(e)}`);
    new ResponseHandler(req, res)(e);
  }
};

export const deserialise = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Deserialise`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Appendable data - ${req.id} :: Deserialise :: ${ app ? 'Authorised' : 'Unauthorised'} request`);
    const handleId = await appendableData.deserialise(req.rawBody);
    const isOwner = await appendableData.isOwner(app, handleId);
    const version = await appendableData.getVersion(handleId);
    const filterType = await appendableData.getFilterType(handleId);
    const dataLength = await appendableData.getLength(handleId, false);
    const deletedDataLength = await appendableData.getLength(handleId, true);
    log.debug(`Appendable data - ${req.id} :: Deserialised appendable data handle`);
    responseHandler(null, {
      handleId: handleId,
      isOwner: isOwner,
      version: version,
      filterType: filterType,
      dataLength: dataLength,
      deletedDataLength: deletedDataLength
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Deserialise error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const serialiseSignKey = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Serialise sign key`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Serialise sign key :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Serialise sign key :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const data = await misc.serialiseSignKey(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Serialised sign key appendable data handle`);
    responseHandler(null, data);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Serialise sign key error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deserialiseSignKey = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Deserialise sign key`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Deserialise sign key :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Deserialise sign key :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const handleId = await misc.deserialiseSignKey(req.rawBody);
    log.debug(`Appendable data - ${req.id} :: Deserialised sign key appendable data handle`);
    responseHandler(null, {
      handleId
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Deserialise sign key error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const dropHandle = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Drop handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    await appendableData.dropHandle(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Dropped handle`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Drop handle error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};
