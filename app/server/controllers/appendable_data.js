import sessionManager from '../session_manager';
import { ResponseError, ResponseHandler, updateAppActivity, parseExpectionMsg } from '../utils';
import { FILTER_TYPE } from '../../ffi/model/enum';
import appendableData from '../../ffi/api/appendable_data';
import misc from '../../ffi/api/misc';
import log from '../../logger/log';

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
    log.debug(`Appendable data - ${req.id} :: Create for ${JSON.stringify({
      name,
      isPrivate,
      filterType,
      filterKeys
    })}`);
    const handleId = await appendableData.create(app, name, isPrivate, filterType, filterKeys);
    log.debug(`Appendable data - ${req.id} :: Created`);
    res.send({
      handleId
    });
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Create :: Caught exception - ${parseExpectionMsg(e)}`);
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
    log.debug(`Appendable data - ${req.id} :: Post successful`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Post :: Caught exception - ${parseExpectionMsg(e)}`);
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
    log.debug(`Appendable data - ${req.id} :: Put successful`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Put :: Caught exception - ${parseExpectionMsg(e)}`);
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
    log.debug(`Appendable data - ${req.id} :: Get handle 
      :: ${app ? 'Authorised' : 'Unauthorised'} request`);
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
      handleId,
      isOwner,
      version,
      filterType,
      dataLength,
      deletedDataLength
    });
    log.debug(`Appendable data - ${req.id} :: Handle obtained`);
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
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
    log.debug(`Appendable data - ${req.id} :: Get metadata 
      :: ${app ? 'Authorised' : 'Unauthorised'} request`);
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
      isOwner,
      version,
      filterType,
      filterLength,
      dataLength,
      deletedDataLength
    };
    log.debug(`Appendable data - ${req.id} :: Metadata obtained`);
    responseHandler(null, metadata);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get metadata :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const isSizeValid = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Check size valid`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const isValid = await appendableData.isSizeValid(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Size validated`);
    responseHandler(null, {
      isValid
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Check size valid :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getDataIdHandle = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Get Data Id handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const handleId = await appendableData.asDataId(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Data Id handle obtained`);
    responseHandler(null, {
      handleId
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get Data Id handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
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
      log.error(`Appendable data - ${req.id} :: Get encrypt key handle :: 
        Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const encryptKeyHandle = await appendableData.getEncryptKey(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Encrypt key handle obtained`);
    responseHandler(null, {
      handleId: encryptKeyHandle
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get encrypt key handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

const getSignKeyAt = async(req, res, next, fromDeleted) => {
  log.debug(`Appendable data - ${req.id} :: Get sign key 
    handle ${fromDeleted ? 'from deleted data' : ''}`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Get sign 
        key handle ${fromDeleted ? 'from deleted data' : ''} :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Get sign key 
        handle ${fromDeleted ? 'from deleted data' : ''} :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const app = sessionInfo.app;
    const signingKeyHandle = await appendableData.getSigningKey(app,
      req.params.handleId, req.params.index, fromDeleted);
    log.debug(`Appendable data - ${req.id} :: Sign key 
      handle ${fromDeleted ? 'from deleted data' : ''} obtained`);
    responseHandler(null, {
      handleId: signingKeyHandle
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get sign key 
    handle ${fromDeleted ? 'from deleted data' : ''} :: 
    Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getSigningKey = async(req, res, next) => {
  getSignKeyAt(req, res, next, false);
};

export const getSigningKeyFromDeletedData = async(req, res, next) => {
  getSignKeyAt(req, res, next, true);
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
    log.debug(`Appendable data - ${req.id} :: Data Appended`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Append :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

const dataIdAt = async(req, res, fromDeleted) => {
  log.debug(`Appendable data - ${req.id} :: Get Data ${fromDeleted ? 'from deleted data' : ''} 
    at index`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Appendable data - ${req.id} :: Get Data ${fromDeleted ? 'from deleted data' : ''} 
    at index :: ${app ? 'Authorised' : 'Unauthorised'} request`);
    const handleId = await appendableData.getDataId(app, req.params.handleId,
      req.params.index, fromDeleted);
    log.debug(`Appendable data - ${req.id} :: Data ${fromDeleted ? 'from deleted data' : ''} 
      at index - ${req.params.index} obtained`);
    responseHandler(null, {
      handleId
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get Data ${fromDeleted ? 'from deleted data' : ''} 
      at index :: Caught exception - ${parseExpectionMsg(e)}`);
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
    log.debug(`Appendable data - ${req.id} :: Filter toggled`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Toggle filter :: 
      Caught exception - ${parseExpectionMsg(e)}`);
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
    for (const key of keys) {
      await appendableData.insertToFilter(req.params.handleId, key);
    }
    log.debug(`Appendable data - ${req.id} :: Added ${keys.length} keys to filter`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Add to filter :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const removeFromFilter = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Remove from filter`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Remove from filter :: 
        Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Remove from filter :: 
        Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const keys = req.body;
    for (const key of keys) {
      await appendableData.removeFromFilter(req.params.handleId, key);
    }
    log.debug(`Appendable data - ${req.id} :: Removed ${keys.length} keys from filter`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Remove from filter :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getSignKeyFromFilter = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Get sign key from filter`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Get sign key from filter :: 
        Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Get sign key from filter :: 
        Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const signKeyHandle = await appendableData.getSignKeyFromFilter(req.params.handleId,
      req.params.index);
    log.debug(`Appendable data - ${req.id} :: 
      Sign key from filter at index - ${req.params.index} obtained`);
    responseHandler(null, {
      handleId: signKeyHandle
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Get sign key from filter :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const remove = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Remove data at index`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Remove data at index :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Remove data at index :: 
        Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.removeDataAt(req.params.handleId, req.params.index, false);
    log.debug(`Appendable data - ${req.id} :: Removed data at index - ${req.params.index}`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Remove data at index :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const removeDeletedData = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Remove deleted data at index`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Remove deleted data at index 
        :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Remove deleted data at index 
        :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.removeDataAt(req.params.handleId, req.params.index, true);
    log.debug(`Appendable data - ${req.id} :: Removed deleted data at index - ${req.params.index}`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Remove deleted data at index :: 
      Caught exception - ${parseExpectionMsg(e)}`);
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
    log.debug(`Appendable data - ${req.id} :: Data cleared`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Clear data :: 
      Caught exception - ${parseExpectionMsg(e)}`);
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
      log.error(`Appendable data - ${req.id} :: Clear deleted data :: 
        Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await appendableData.clearAll(req.params.handleId, true);
    log.debug(`Appendable data - ${req.id} :: Deleted data cleared`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Clear deleted data :: 
      Caught exception - ${parseExpectionMsg(e)}`);
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
      log.error(`Appendable data - ${req.id} :: Drop encrypt key handle :: 
        Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await misc.dropEncryptKeyHandle(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Encrypt key handle dropped`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Drop encrypt key handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
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
      log.error(`Appendable data - ${req.id} :: Drop signing key handle :: 
        Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await misc.dropSignKeyHandle(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Signing key handle dropped`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Drop signing key handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deleteAppendableData = async(req, res, next) => {
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
    log.debug(`Appendable data - ${req.id} :: Deleted`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Delete :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const restore = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Restore data at index`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: Restore data at index :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: Restore data at index 
        :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    if (isNaN(req.params.index)) {
      return next(new ResponseError(400, 'index must be a valid number'));
    }
    await appendableData.restore(req.params.handleId, parseInt(req.params.index, 10));
    log.debug(`Appendable data - ${req.id} :: Data restored at index - ${req.params.index}`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Restored :: 
      Caught exception - ${parseExpectionMsg(e)}`);
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
    log.debug(`Appendable data - ${req.id} :: Serialised`);
    res.send(data);
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Serialise :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    new ResponseHandler(req, res)(e);
  }
};

export const deserialise = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Deserialise`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Appendable data - ${req.id} :: Deserialise 
      :: ${app ? 'Authorised' : 'Unauthorised'} request`);
    const handleId = await appendableData.deserialise(req.rawBody);
    const isOwner = await appendableData.isOwner(app, handleId);
    const version = await appendableData.getVersion(handleId);
    const filterType = await appendableData.getFilterType(handleId);
    const dataLength = await appendableData.getLength(handleId, false);
    const deletedDataLength = await appendableData.getLength(handleId, true);
    log.debug(`Appendable data - ${req.id} :: Deserialised`);
    responseHandler(null, {
      handleId,
      isOwner,
      version,
      filterType,
      dataLength,
      deletedDataLength
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Deserialise :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getSignKey = async(req, res, next) => {
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
    const signKeyHandle = await misc.getSignKey(app);
    responseHandler(null, {
      handleId: signKeyHandle
    });
  } catch (e) {
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
      log.error(`Appendable data - ${req.id} :: Serialise sign key :: 
        Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const data = await misc.serialiseSignKey(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Serialised sign key`);
    responseHandler(null, data);
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Serialise sign key :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deserialiseSignKey = async(req, res, next) => {
  log.debug(`Appendable data - ${req.id} :: Deserialise sign key`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Appendable data - ${req.id} :: 
        Deserialise sign key :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    if (!sessionInfo.app.permission.lowLevelApi) {
      log.error(`Appendable data - ${req.id} :: 
        Deserialise sign key :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const handleId = await misc.deserialiseSignKey(req.rawBody);
    log.debug(`Appendable data - ${req.id} :: Deserialised sign key`);
    responseHandler(null, {
      handleId
    });
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Deserialise sign key :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const dropHandle = async(req, res) => {
  log.debug(`Appendable data - ${req.id} :: Drop handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    await appendableData.dropHandle(req.params.handleId);
    log.debug(`Appendable data - ${req.id} :: Handle dropped`);
    responseHandler();
  } catch (e) {
    log.warn(`Appendable data - ${req.id} :: Drop handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};
