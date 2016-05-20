'use strict';

import util from 'util';
import jwt from 'jsonwebtoken';
import * as sodium from 'libsodium-wrappers';
import sessionManager from '../session_manager';
import SessionInfo from '../model/session_info';
import Permission from '../model/permission';
import {
  getSessionIdFromRequest
} from '../utils'
import { log } from './../../logger/log';

export let CreateSession = function(data) {
  let req = data.request;
  let res = data.response;
  log.debug('Waiting for directory key for creating an session');

  this.onDirKey = function(err, dirKey) {
    let authReq = req.body;
    if (err) {
      log.error('Creating session :: ' + err);
      return res.status(500).send(err.errorMsg);
    }
    log.debug('Directory key for creating an session obtained');
    let app = authReq.app;
    let assymetricKeyPair = sodium.crypto_box_keypair();
    try {
      log.debug('Creating session');
      let sessionId = new Buffer(sodium.randombytes_buf(32)).toString('base64');
      let appPubKey = new Uint8Array(new Buffer(authReq.publicKey, 'base64'));
      let appNonce = new Uint8Array(new Buffer(authReq.nonce, 'base64'));
      let sessionInfo = new SessionInfo(app.id, app.name, app.version, app.vendor, data.permissions, dirKey);
      let symmetricKey = Buffer.concat([new Buffer(sessionInfo.secretKey), new Buffer(sessionInfo.nonce)]);
      let encryptedKey = sodium.crypto_box_easy(new Uint8Array(symmetricKey), appNonce, appPubKey, assymetricKeyPair.privateKey);
      let payload = JSON.stringify({
        id: sessionId
      });
      let token = jwt.sign(payload, new Buffer(sessionInfo.signingKey));
      sessionManager.put(sessionId, sessionInfo);
      let eventType = req.app.get('EVENT_TYPE').SESSION_CREATED;
      req.app.get('eventEmitter').emit(eventType, {
        id: sessionId,
        info: sessionInfo
      });
      log.debug('Session created :: ' + sessionId);
      res.status(200).send({
        token: token,
        encryptedKey: new Buffer(encryptedKey).toString('base64'),
        publicKey: new Buffer(assymetricKeyPair.publicKey).toString('base64'),
        permissions: authReq.permissions
      });
    } catch (e) {
      res.status(500).send(e.toString());
    }
  }
  return this.onDirKey;
}

export var authorise = function(req, res) {
  log.debug('Authorisation request recieved');
  let authReq = req.body;
  if (!(authReq.app && authReq.app.name && authReq.app.id && authReq.app.vendor &&
      authReq.app.version && authReq.publicKey && authReq.nonce)) {
    log.debug('Authorisation request - fields missing');
    return res.status(400).send('Fields are missing');
  }
  if (!authReq.hasOwnProperty('permissions')) {
    log.debug('Authorisation request - permissions field missing');
    return res.status(400).send('permissions are missing');
  }
  let permissions = new Permission(authReq.permissions);
  if (!permissions.isValid()) {
    log.debug('Authorisation request - Invalid permissions requested');
    return res.status(400).send('Invalid permissions');
  }
  var publicKeyLength = new Buffer(authReq.publicKey, 'base64').length;
  var nonceLength = new Buffer(authReq.nonce, 'base64').length;

  if (nonceLength !== sodium.crypto_box_NONCEBYTES) {
    log.debug('Authorisation request - Invalid nonce');
    return res.status(400).send('Invalid nonce');
  }
  if (publicKeyLength !== sodium.crypto_box_PUBLICKEYBYTES) {
    log.debug('Authorisation request - Invalid public key');
    return res.status(400).send('Invalid public key');
  }

  let payload = {
    payload: authReq,
    request: req,
    response: res,
    permissions: permissions
  };
  let eventType = req.app.get('EVENT_TYPE').AUTH_REQUEST;
  log.debug('Emitting event for Auth Request Recieved');
  req.app.get('eventEmitter').emit(eventType, payload);
}

export var revoke = function(req, res) {
  log.debug('Revoke Authorisation request recieved');
  let sessionId = getSessionIdFromRequest(req);
  if (!sessionId) {
    log.debug('Revoke Authorisation request - Session not found - ' + sessionId);
    return res.sendStatus(401);
  }
  sessionManager.remove(sessionId);
  log.debug('Revoke Authorisation request - Session Removed - ' + sessionId);
  let eventType = req.app.get('EVENT_TYPE').SESSION_REMOVED;
  req.app.get('eventEmitter').emit(eventType, sessionId);
  res.sendStatus(200);
}

export var isTokenValid = function(req, res) {
  if (!req.headers['sessionId']) {
    return res.sendStatus(401);
  }
  return res.sendStatus(200);
}
