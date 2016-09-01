import util from 'util';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sessionManager from '../session_manager';
import SessionInfo from '../model/session_info';
import Permission from '../model/permission';
import {
  ResponseError, ResponseHandler
} from '../utils';
import { log } from './../../logger/log';
import { MSG_CONSTANTS } from './../message_constants';

export let CreateSession = function(data) {
  let req = data.request;
  let res = data.response;
  log.debug('Waiting for directory key for creating an session');

  var emitSessionCreationFailed = function() {
    let eventType = req.app.get('EVENT_TYPE').SESSION_CREATION_FAILED;
    req.app.get('eventEmitter').emit(eventType);
  };

  this.onDirKey = function(err, dirKey) {
    let authReq = req.body;
    if (err) {
      log.error('Creating session :: ' + JSON.stringify(err));
      emitSessionCreationFailed();
      return req.next(new ResponseError(500, err));
    }
    log.debug('Directory key for creating an session obtained');
    let app = authReq.app;
    let isNewSession = false;
    try {
      let sessionId = sessionManager.hasSessionForApp(app);
      let sessionInfo;
      if (sessionId) {
        log.debug('Using existing session');
        sessionInfo = sessionManager.get(sessionId);
      } else {
        log.debug('Creating session');
        sessionId = crypto.randomBytes(32).toString('base64');
        sessionInfo = new SessionInfo(app.id, app.name, app.version, app.vendor, data.permissions, dirKey);
        isNewSession = true;
      }
      let payload = JSON.stringify({
        id: sessionId
      });
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
      log.debug('Session for app created');
      new ResponseHandler(req, res)(null, {
        token: token,
        permissions: authReq.permissions
      });
    } catch (e) {
      emitSessionCreationFailed();
      req.next(new ResponseError(500, e.message));
    }
  };
  return this.onDirKey;
};

export var authorise = function(req, res, next) {
  log.debug('Authorisation request received');
  let authReq = req.body;
  if (!(authReq.app && authReq.app.name && authReq.app.id && authReq.app.vendor &&
      authReq.app.version)) {
    log.debug('Authorisation request - fields missing');
    return next(new ResponseError(400, 'Fields are missing'));
  }
  if (!(/[^\s]/.test(authReq.app.name) && /[^\s]/.test(authReq.app.id) && /[^\s]/.test(authReq.app.vendor) &&
    /[^\s]/.test(authReq.app.version))) {
    log.debug('Authorisation request - fields invalid');
    return next(new ResponseError(400, 'Values cannot be empty'));
  }
  if (!authReq.hasOwnProperty('permissions')) {
    log.debug('Authorisation request - permissions field missing');
    return next(new ResponseError(400, 'Permission field is missing'));
  }
  let permissions = new Permission(authReq.permissions);
  if (!permissions.isValid()) {
    log.debug('Authorisation request - Invalid permissions requested');
    return next(new ResponseError(400, 'Invalid permissions requested'));
  }

  let payload = {
    payload: authReq,
    request: req,
    response: res,
    permissions: permissions
  };
  let eventType = req.app.get('EVENT_TYPE').AUTH_REQUEST;
  log.debug('Emitting event for auth request received');
  req.app.get('eventEmitter').emit(eventType, payload);
};

export var revoke = function(req, res, next) {
  log.debug('Revoke authorisation request received');
  let sessionId = req.headers.sessionId;
  if (!sessionId) {
    log.debug('Revoke authorisation request - Session not found - ' + sessionId);
    return next(new ResponseError(401));
  }
  sessionManager.remove(sessionId);
  log.debug('Revoke authorisation request - Session removed - ' + sessionId);
  let eventType = req.app.get('EVENT_TYPE').SESSION_REMOVED;
  req.app.get('eventEmitter').emit(eventType, sessionId);
  new ResponseHandler(req, res)();
};

export var isTokenValid = function(req, res, next) {
  if (!req.headers.sessionId) {
    return next(new ResponseError(401));
  }
  return new ResponseHandler(req, res)();
};
