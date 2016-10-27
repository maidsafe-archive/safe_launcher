'use strict';

import sessionManager from '../session_manager';
import { ResponseError, ResponseHandler, updateAppActivity, parseExpectionMsg } from '../utils';
import misc from '../../ffi/api/misc';
import dataId from '../../ffi/api/data_id';
import { log } from '../../logger/log';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';

export const getDataIdForStructuredData = async(req, res) => {
  log.debug(`DATA ID - ${req.id} :: Get data id for structured data`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : undefined;
    log.debug(`DATA ID - ${req.id} :: Get data id for structured data :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    log.debug(`DATA ID - ${req.id} :: Get data id for structured data for ${JSON.stringify({
      name: req.body.name,
      typeTag: req.body.typeTag
    })}`);
    const name = new Buffer(req.body.name, 'base64');
    const handleId = await dataId.getStructuredDataHandle(req.body.typeTag, name);
    responseHandler(null, {
      handleId: handleId
    });
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Get data id for structured data error :: ${e.message}`);
    responseHandler(e);
  }
};

export const getDataIdForAppendableData = async(req, res) => {
  log.debug(`DATA ID - ${req.id} :: Get data id for appendable data`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : undefined;
    log.debug(`DATA ID - ${req.id} :: Get data id for appendable data :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    log.debug(`DATA ID - ${req.id} :: Get data id for appendable data for ${JSON.stringify({
      name: req.body.name,
      isPrivate: req.body.isPrivate
    })}`);
    const name = new Buffer(req.body.name, 'base64');
    const handleId = await dataId.getAppendableDataHandle(name, req.body.isPrivate);
    responseHandler(null, {
      handleId: handleId
    });
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Get data id for appendable data error :: ${e.message}`);
    responseHandler(e);
  }
};

export const serialise = async(req, res, next) => {
  log.debug(`DATA ID - ${req.id} :: Get data id for serialise data`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DATA ID - ${req.id} :: Get data id for serialise data :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo ? sessionInfo.app : undefined;
    log.debug(`DATA ID - ${req.id} :: Get data id for serialise data :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    if (!app.permission.lowLevelApi) {
      log.error(`DATA ID - ${req.id} :: Get data id for serialise data :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const data = await misc.serialiseDataId(req.params.handleId);
    log.debug(`DATA ID - ${req.id} :: Got serialised data`);
    res.send(data);
    updateAppActivity(req, res, true);
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Get data id for serialise data error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deserialise = async(req, res, next) => {
  log.debug(`DATA ID - ${req.id} :: Get data id for deserialise data`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`DATA ID - ${req.id} :: Get data id for deserialise data :: ${ app ? 'Authorised' : 'Unauthorised' } request`);
    if (!req.rawBody || req.rawBody.length === 0) {
      return next(new ResponseError(400, 'Body can not be empty'));
    }
    const dataHandle = await misc.deserialiseDataId(req.rawBody);
    log.debug(`DATA ID - ${req.id} :: Got deserialised data`);
    responseHandler(null, {
      handleId: dataHandle
    });
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Get data id for deserialise data error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const dropHandle = async(req, res, next) => {
  log.debug(`DATA ID - ${req.id} :: Get data id for drop handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const responseHandler = new ResponseHandler(req, res);
    await dataId.dropHandle(req.params.handleId);
    log.debug(`DATA ID - ${req.id} :: Handled dropped`);
    responseHandler();
  } catch (e) {
    log.warn(`DATA ID - ${req.id} :: Get data id for drop handle error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};
