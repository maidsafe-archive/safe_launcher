'use strict';

import sessionManager from '../session_manager';
import { ResponseError, ResponseHandler, updateAppActivity, parseExpectionMsg } from '../utils';
import structuredData from '../../ffi/api/structured_data';
import cipherOpts from '../../ffi/api/cipher_opts';
import { log } from '../../logger/log';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';
const NAME_LENGTH = 32;
let PLAIN_ENCRYPTION;

const getPlainEncryptionHandle = () => {
  return new Promise(async(resolve, reject) => {
    if (PLAIN_ENCRYPTION === undefined) {
      try {
        PLAIN_ENCRYPTION = await cipherOpts.getCipherOptPlain();
      } catch (e) {
        reject(e);
      }
    }
    resolve(PLAIN_ENCRYPTION);
  });
};

const TYPE_TAG = {
  UNVERSIONED: 500,
  VERSIONED: 501
};

export const create = async(req, res, next) => {
  log.debug(`Structured Data - ${req.id} :: Create`);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Structured Data - ${req.id} :: Create :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Structured Data - ${req.id} :: Create :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const body = req.body;
    if (!body.name) {
      return next(new ResponseError(400, 'name is missing in request body'));
    }
    const name = new Buffer(body.name, 'base64');
    if (!name || name.length !== NAME_LENGTH) {
      return next(new ResponseError(400, 'Invalid id specified'));
    }
    let typeTag = body.typeTag || TYPE_TAG.UNVERSIONED;
    if (isNaN(typeTag)) {
      return next(new ResponseError(400, 'Tag type must be a valid number'));
    }
    typeTag = parseInt(typeTag);
    if (!(typeTag === TYPE_TAG.UNVERSIONED || typeTag === TYPE_TAG.VERSIONED || typeTag >= 15000)) {
      return next(new ResponseError(400, 'Invalid tag type specified'));
    }
    const cipherOptsHandle = body.cipherOpts || (await getPlainEncryptionHandle());
    const data = body.data ? new Buffer(body.data, 'base64') : null;
    const version = body.hasOwnProperty('version') ? body.version : 0;
    log.debug(`Structured Data - ${req.id} :: Create for payload - ${JSON.stringify({
      name,
      typeTag,
      cipherOpts,
      version,
      data: data ? 'With data' : 'Without data'
    })}`);
    const handleId = await structuredData.create(app, name, typeTag, cipherOptsHandle, data, version);
    log.debug(`Structured Data - ${req.id} :: Created`);
    res.send({
      handleId: handleId
    });
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Create :: Caught exception - ${parseExpectionMsg(e)}`);
    new ResponseHandler(req, res)(e);
  }
};

export const getHandle = async(req, res) => {
  log.debug(`Structured Data - ${req.id} :: Get handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Structured Data - ${req.id} :: Get handle :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    const handleId = await structuredData.asStructuredData(app, req.params.dataIdHandle);
    let isOwner = false;
    if (sessionInfo) {
      isOwner = await structuredData.isOwner(app, handleId);
    }
    const version = await structuredData.getVersion(handleId);
    const dataVersion = await structuredData.getDataVersionsCount(handleId);
    log.debug(`Structured Data - ${req.id} :: Handle obtained`);
    responseHandler(null, {
      handleId: handleId,
      isOwner: isOwner,
      version: version,
      dataVersionLength: dataVersion
    });
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Get handle :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getMetadata = async(req, res) => {
  log.debug(`Structured Data - ${req.id} :: Get metadata`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Structured Data - ${req.id} :: Get metadata :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    const handleId = req.params.handleId;
    let isOwner = false;
    if (sessionInfo) {
      isOwner = await structuredData.isOwner(app, handleId);
    }
    const version = await structuredData.getVersion(handleId);
    const dataVersion = await structuredData.getDataVersionsCount(handleId);
    log.debug(`Structured Data - ${req.id} :: Metadata obtained`);
    responseHandler(null, {
      isOwner: isOwner,
      version: version,
      dataVersionLength: dataVersion
    });
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Get metadata :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const asDataId = async(req, res) => {
  log.debug(`Structured Data - ${req.id} :: Get Data Id handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Structured Data - ${req.id} :: Get Data Id handle :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    const handleId = req.params.handleId;
    const dataIdHandle = await structuredData.asDataId(handleId);
    log.debug(`Structured Data - ${req.id} :: Data Id handle obtained`);
    responseHandler(null, {
      handleId: dataIdHandle
    });
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Get Data Id handle :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const update = async(req, res, next) => {
  log.debug(`Structured Data - ${req.id} :: Update`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Structured Data - ${req.id} :: Update :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Structured Data - ${req.id} :: Update :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const cipherOptsHandle = req.body.cipherOpts || (await getPlainEncryptionHandle());
    const data = new Buffer(req.body.data, 'base64');
    log.debug(`Structured Data - ${req.id} :: Update for payload - ${JSON.stringify({
      cipherOpts: req.body.cipherOpts,
      data: req.body.data ? 'With data' : 'Without data'
    })}`)
    await structuredData.update(app, req.params.handleId, cipherOptsHandle, data);
    log.debug(`Structured Data - ${req.id} :: Updated`);
    responseHandler();
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Update :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const read = async(req, res) => {
  log.debug(`Structured Data - ${req.id} :: Read`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Structured Data - ${req.id} :: Read :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    const data = await structuredData.read(app, req.params.handleId, req.params.version);
    log.debug(`Structured Data - ${req.id} :: Read successful`);
    res.send(data);
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Read :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deleteStructureData = async(req, res, next) => {
  log.debug(`Structured Data - ${req.id} :: Delete`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Structured Data - ${req.id} :: Delete :: Unauthorised request`);
      return next(new ResponseError(401, 'Unauthorized'));
    }
    const app = sessionInfo ? sessionInfo.app : null;
    const handleId = parseInt(req.params.handleId);
    await structuredData.delete(app, handleId);
    log.debug(`Structured Data - ${req.id} :: Deleted`);
    responseHandler();
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Delete :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const post = async(req, res, next) => {
  log.debug(`Structured Data - ${req.id} :: Post`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Structured Data - ${req.id} :: Post :: Unauthorised request`);
      return next(new ResponseError(401, 'Unauthorized'));
    }
    const app = sessionInfo ? sessionInfo.app : null;
    const handleId = req.params.handleId;
    await structuredData.save(app, handleId, true);
    log.debug(`Structured Data - ${req.id} :: Post successful`);
    responseHandler();
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Post :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const put = async(req, res, next) => {
  log.debug(`Structured Data - ${req.id} :: Put`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Structured Data - ${req.id} :: Put :: Unauthorised request`);
      return next(new ResponseError(401, 'Unauthorized'));
    }
    const app = sessionInfo ? sessionInfo.app : null;
    const handleId = req.params.handleId;
    await structuredData.save(app, handleId, false);
    log.debug(`Structured Data - ${req.id} :: Put successful`);
    responseHandler();
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Put :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deleteStructuredData = async(req, res, next) => {
  log.debug(`Structured Data - ${req.id} :: Delete`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Structured Data - ${req.id} :: Delete :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Structured Data - ${req.id} :: Delete :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await structuredData.delete(app, req.params.handleId, false);
    log.debug(`Structured Data - ${req.id} :: Deleted`);
    responseHandler();
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Delete :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const isSizeValid = async(req, res, next) => {
  log.debug(`Structured Data - ${req.id} :: Check size valid`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const isValid = await structuredData.isSizeValid(req.params.handleId);
    log.debug(`Structured Data - ${req.id} :: Size validated`);
    responseHandler(null, {
      isValid: isValid
    });
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Check size valid :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const makeStructuredDataUnclaimable = async(req, res, next) => {
  log.debug(`Structured Data - ${req.id} :: Make unclimbable`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Structured Data - ${req.id} :: Make unclimbable :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Structured Data - ${req.id} :: Make unclimbable :: Unauthorised request`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await structuredData.delete(app, req.params.handleId, true);
    log.debug(`Structured Data - ${req.id} :: Make unclimbable successful`);
    responseHandler();
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Make unclimbable :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const dropHandle = async(req, res) => {
  log.debug(`Structured Data - ${req.id} :: Drop handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const handleId = req.params.handleId;
    await structuredData.dropHandle(handleId);
    log.debug(`Structured Data - ${req.id} :: Handle dropped`);
    responseHandler();
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Drop handle :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const serialise = async(req, res) => {
  log.debug(`Structured Data - ${req.id} :: Serialise`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const handleId = req.params.handleId;
    const data = await structuredData.serialise(handleId);
    log.debug(`Structured Data - ${req.id} :: Serialised`);
    res.send(data);
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Serialise :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deserialise = async(req, res) => {
  log.debug(`Structured Data - ${req.id} :: Deserialise`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    const handleId = await structuredData.deserialise(req.rawBody);
    const isOwner = app ? await structuredData.isOwner(app, handleId) : false;
    const version = await structuredData.getVersion(handleId);
    const dataVersion = await structuredData.getDataVersionsCount(handleId);
    log.debug(`Structured Data - ${req.id} :: Deserialised`);
    responseHandler(null, {
      handleId: handleId,
      isOwner: isOwner,
      version: version,
      dataVersionLength: dataVersion
    });
  } catch (e) {
    log.warn(`Structured Data - ${req.id} :: Deserialise :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};
