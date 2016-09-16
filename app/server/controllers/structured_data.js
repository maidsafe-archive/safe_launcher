import sessionManager from '../session_manager';
import {ResponseError, ResponseHandler, updateAppActivity} from '../utils';
import structuredData from '../../ffi/api/structured_data';
import dataId from '../../ffi/api/data_id';
import { ENCRYPTION_TYPE } from '../../ffi/model/enum';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';
const HANDLE_ID_KEY = 'Handle-Id';
const ID_LENGTH = 32;

const TAG_TYPE = {
  UNVERSIONED: 500,
  VERSIONED: 501
};

const createOrUpdate = async (req, res, next, isCreate = true) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    let typeTag = req.headers['type-tag'] || TAG_TYPE.UNVERSIONED;
    if (isNaN(typeTag)) {
      return next(new ResponseError(400, 'Tag type must be a valid number'));
    }
    typeTag = parseInt(typeTag)
    if (!(typeTag === TAG_TYPE.UNVERSIONED || typeTag === TAG_TYPE.VERSIONED || typeTag >= 15000)) {
      return next(new ResponseError(400, 'Invalid tag type specified'));
    }
    let encryptionType = ENCRYPTION_TYPE.PLAIN;
    if (req.headers['encryption'] && !ENCRYPTION_TYPE[req.headers['encryption'].toUpperCase()]) {
      return next(new ResponseError(400, 'Invalid encryption type specified'));
    } else {
      encryptionType = ENCRYPTION_TYPE[req.headers['encryption'].toUpperCase()];
    }
    let publicKeyHandle;
    if (encryptionType === ENCRYPTION_TYPE.ASYMMETRIC) {
      if (!res.headers['encrypt-key-handle']) {
        return next(new ResponseError(400, 'Public key handle is not present in the header'));
      }
      if (isNaN(res.headers['encrypt-key-handle'])) {
        return next(new ResponseError(400, 'Public key handle is not a valid number'));
      }
      publicKeyHandle = parseInt(res.headers['encrypt-key-handle']);
    }
    let data = null;
    if (req.rawBody && req.rawBody.length > 0) {
      data = new Buffer(req.rawBody);
    }
    let handleId;
    if (isCreate) {
      const id = new Buffer(req.params.id, 'base64');
      if (!id || id.length !== ID_LENGTH) {
        return next(new ResponseError(400, 'Invalid id specified'));
      }
      handleId = await structuredData.create(app, id, typeTag, encryptionType, data, publicKeyHandle);
    } else {
      handleId = await structuredData.update(app, req.params.handleId, encryptionType, data, publicKeyHandle);
    }
    res.set(HANDLE_ID_KEY, handleId);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    console.error(e);
    new ResponseHandler(req, res)(e);
  }
};

export const create = (req, res, next) => {
  createOrUpdate(req, res, next, true);
};

// GET /handle/{id}
export const getHandle = async (req, res, next) => {
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    const id = new Buffer(req.params.id, 'base64');
    if (!id || id.length !== ID_LENGTH) {
      return next(new ResponseError(400, 'Invalid id specified'));
    }
    let typeTag = req.headers['type-tag'] || TAG_TYPE.UNVERSIONED;
    if (isNaN(typeTag)) {
      return next(new ResponseError(400, 'Tag type must be a valid number'));
    }
    typeTag = parseInt(typeTag)
    if (!(typeTag === TAG_TYPE.UNVERSIONED || typeTag === TAG_TYPE.VERSIONED || typeTag >= 15000)) {
      return next(new ResponseError(400, 'Invalid tag type specified'));
    }
    const result = await dataId.getStructuredDataHandle(typeTag, id);
    // res.set('Is-Owner', result.isOwner);
    res.set(HANDLE_ID_KEY, result);
    res.sendStatus(200);
    updateAppActivity(req, res, true);
  } catch(e) {
    new ResponseHandler(req, res)(e);
  }
};

export const update = (req, res, next) => {
  createOrUpdate(req, res, next, false);
};

export const read = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    const handleId = parseInt(req.params.handleId);
    const data = await structuredData.read(app, handleId);
    res.send(data || new Buffer(0));
    updateAppActivity(req, res, true);
  } catch (e) {
    console.error(e);
    responseHandler(e);
  }
};
