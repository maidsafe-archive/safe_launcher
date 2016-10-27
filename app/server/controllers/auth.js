import util from 'util';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sessionManager from '../session_manager';
import App from '../../ffi/model/app';
import SessionInfo from '../model/session_info';
import Permission from '../../ffi/model/permission';
import appManager from '../../ffi/util/app_manager';
import {
  ResponseError, ResponseHandler, parseExpectionMsg
} from '../utils';
import { log } from './../../logger/log';

export let CreateSession = async (data) => {
  const req = data.request;
  const res = data.response;
  const appInfo = data.payload.app;
  const permissions = data.permissions;

  const emitSessionCreationFailed = () => {
    let eventType = req.app.get('EVENT_TYPE').SESSION_CREATION_FAILED;
    req.app.get('eventEmitter').emit(eventType);
  };

  const onRegistered = (app) => {
    let authReq = req.body;
    log.debug(`Auth :: ${req.id} :: Directory key for creating an session obtained`);
    let isNewSession = false;
    try {
      let sessionId = sessionManager.hasSessionForApp(app);
      let sessionInfo;
      if (sessionId) {
        log.debug(`Auth :: ${req.id } :: Using existing session`);
        sessionInfo = sessionManager.get(sessionId);
      } else {
        log.debug(`Auth :: ${req.id} :: Creating session`);
        sessionId = crypto.randomBytes(32).toString('base64');
        sessionInfo = new SessionInfo(app);
        isNewSession = true;
      }
      let payload = {
        id: sessionId
      };
      let token = jwt.sign(payload, new Buffer(sessionInfo.signingKey));
      sessionManager.put(sessionId, sessionInfo);
      let eventType = req.app.get('EVENT_TYPE').SESSION_CREATED;
      if (isNewSession) {
        req.app.get('eventEmitter').emit(eventType, {
          id: sessionId,
          info: sessionInfo
        });
      } else {
        emitSessionCreationFailed();
      }
      log.debug(`Auth :: ${req.id} :: Session created`);
      new ResponseHandler(req, res)(null, {
        token: token,
        permissions: permissions.list
      });
    } catch (e) {
      log.warn(`Auth :: ${req.id} :: Create Session error :: ${parseExpectionMsg(e)}`);
      emitSessionCreationFailed();
      req.next(new ResponseError(500, e.message));
    }
  };
  try {
    const app = new App(appInfo.name, appInfo.id, appInfo.vendor, appInfo.version, permissions);
    await appManager.registerApp(app);
    onRegistered(app);
  } catch(e) {
    log.warn(`Auth :: ${req.id} :: Register App :: ${parseExpectionMsg(e)}`);
    emitSessionCreationFailed();
    return req.next(new ResponseError(500, e));
  }
};

export var authorise = function(req, res, next) {
  log.debug(`Auth :: ${req.id} :: Authorisation request received`);
  let authReq = req.body;
  if (!(authReq.app && authReq.app.name && authReq.app.id && authReq.app.vendor &&
      authReq.app.version)) {
    log.debug(`Auth :: ${req.id} :: Authorisation request - fields missing`);
    return next(new ResponseError(400, 'Fields are missing'));
  }
  if (!(/[^\s]/.test(authReq.app.name) && /[^\s]/.test(authReq.app.id) && /[^\s]/.test(authReq.app.vendor) &&
    /[^\s]/.test(authReq.app.version))) {
    log.debug(`Auth :: ${req.id} :: Authorisation request - fields invalid`);
    return next(new ResponseError(400, 'Values cannot be empty'));
  }
  if (!authReq.hasOwnProperty('permissions')) {
    log.debug(`Auth :: ${req.id} :: Authorisation request - permissions field missing`);
    return next(new ResponseError(400, 'Permission field is missing'));
  }
  let permissions;
  try {
    permissions = new Permission(authReq.permissions);
  } catch(e) {
    log.debug(`Auth :: ${req.id} :: Authorisation request - Invalid permissions requested`);
    return next(new ResponseError(400, 'Invalid permissions requested'));
  }
  log.debug(`Auth :: ${req.id} :: Authorisation request for ${JSON.stringify(authReq)}`);
  const payload = {
    payload: authReq,
    request: req,
    response: res,
    permissions: permissions
  };
  const eventType = req.app.get('EVENT_TYPE').AUTH_REQUEST;
  log.debug(`Auth :: ${req.id} :: Emitting event for auth request received`);
  req.app.get('eventEmitter').emit(eventType, payload);
};

export var revoke = function(req, res, next) {
  log.debug(`Auth :: ${req.id} :: Revoke authorisation request received`);
  let sessionId = req.headers.sessionId;
  if (!sessionId) {
    log.debug(`Auth :: ${req.id} :: Revoke authorisation request - Session not found - ${sessionId}`);
    return next(new ResponseError(401));
  }
  sessionManager.remove(sessionId);
  log.debug(`Auth :: ${req.id} :: Revoke authorisation request - Session removed - ${sessionId}`);
  let eventType = req.app.get('EVENT_TYPE').SESSION_REMOVED;
  req.app.get('eventEmitter').emit(eventType, sessionId);
  new ResponseHandler(req, res)();
};

export var isTokenValid = function(req, res, next) {
  log.debug(`Auth :: ${req.id} :: Check authorisation token valid`);
  if (!req.headers.sessionId) {
    log.debug(`Auth :: ${req.id} :: Return authorisation token invalid`);
    return next(new ResponseError(401));
  }
  log.debug(`Auth :: ${req.id} :: Return authorisation token valid`);
  return new ResponseHandler(req, res)();
};
