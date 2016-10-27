'use strict';

import sessionManager from '../session_manager';
import { ResponseError, ResponseHandler, updateAppActivity, parseExpectionMsg } from '../utils';
import misc from '../../ffi/api/misc';
import dataId from '../../ffi/api/data_id';
import { log } from '../../logger/log';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';

export const getDataIdForStructuredData = async(req, res) => {
  log.debug(`DATA ID - ${req.id} :: Structured data - Get data Id handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : undefined;
    log.debug(`DATA ID - ${req.id} :: Structured data - Get data Id handle :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    log.debug(`DATA ID - ${req.id} :: Structured data - Get data Id handle for ${JSON.stringify({
      name: req.body.name,
      typeTag: req.body.typeTag
    })}`);
    const name = new Buffer(req.body.name, 'base64');
    const handleId = await dataId.getStructuredDataHandle(req.body.typeTag, name);
    log.debug(`DATA ID - ${req.id} :: Structured data - Data Id handle obtained`);
    responseHandler(null, {
      handleId: handleId
    });
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Structured data - Get data Id handle :: Caught exception - ${e.message}`);
    responseHandler(e);
  }
};

export const getDataIdForAppendableData = async(req, res) => {
  log.debug(`DATA ID - ${req.id} :: Appendable data - Get data Id handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : undefined;
    log.debug(`DATA ID - ${req.id} :: Appendable data - Get data Id handle :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    log.debug(`DATA ID - ${req.id} :: Appendable data - Get data Id handle for ${JSON.stringify({
      name: req.body.name,
      isPrivate: req.body.isPrivate
    })}`);
    const name = new Buffer(req.body.name, 'base64');
    const handleId = await dataId.getAppendableDataHandle(name, req.body.isPrivate);
    responseHandler(null, {
      handleId: handleId
    });
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Appendable data - Get data Id handle :: Caught exception - ${e.message}`);
    responseHandler(e);
  }
};

export const serialise = async(req, res, next) => {
  log.debug(`DATA ID - ${req.id} :: Serialise`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DATA ID - ${req.id} :: Serialise :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo ? sessionInfo.app : undefined;
    if (!app.permission.lowLevelApi) {
      log.error(`DATA ID - ${req.id} :: Serialise :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const data = await misc.serialiseDataId(req.params.handleId);
    log.debug(`DATA ID - ${req.id} :: Serialised`);
    res.send(data);
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Serialise :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deserialise = async(req, res, next) => {
  log.debug(`DATA ID - ${req.id} :: Deserialise`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`DATA ID - ${req.id} :: Deserialise :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    if (!req.rawBody || req.rawBody.length === 0) {
      return next(new ResponseError(400, 'Body can not be empty'));
    }
    const dataHandle = await misc.deserialiseDataId(req.rawBody);
    log.debug(`DATA ID - ${req.id} :: Deserialised`);
    responseHandler(null, {
      handleId: dataHandle
    });
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Deserialise :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const dropHandle = async(req, res, next) => {
  log.debug(`DATA ID - ${req.id} :: Drop handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const responseHandler = new ResponseHandler(req, res);
    await dataId.dropHandle(req.params.handleId);
    log.debug(`DATA ID - ${req.id} :: Handle dropped`);
    responseHandler();
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Drop handle :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};
