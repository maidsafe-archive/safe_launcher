'use strict';

import util from 'util';
import jwt from 'jsonwebtoken';
import * as sodium from 'libsodium-wrappers';
import sessionManager from '../session_manager';
import SessionInfo from '../model/session_info';
import { getSessionIdFromRequest } from '../utils'

export var createSession = function(req, res) {
  this.onDirKey = function(err, dirKey) {
    let authReq = req.body;
    if (err) {
      return res.status(500).send(err.errorMsg);
    }
    let app = authReq.app;
    let assymetricKeyPair = sodium.crypto_box_keypair();
    try {
      let sessionId = new Buffer(sodium.randombytes_buf(32)).toString('base64');
      let appPubKey = new Uint8Array(new Buffer(authReq.publicKey, 'base64'));
      let appNonce = new Uint8Array(new Buffer(authReq.nonce, 'base64'));
      let sessionInfo = new SessionInfo(app.id, app.name, app.version, app.vendor, authReq.permissions, dirKey);
      let symmetricKey = Buffer.concat([new Buffer(sessionInfo.secretKey), new Buffer(sessionInfo.nonce)]);
      let encryptedKey = sodium.crypto_box_easy(new Uint8Array(symmetricKey), appNonce, appPubKey, assymetricKeyPair.privateKey);
      let payload = JSON.stringify({ id: sessionId });
      let token = jwt.sign(payload, new Buffer(sessionInfo.signingKey));
      sessionManager.put(sessionId, sessionInfo);
      let eventType = req.app.get('EVENT_TYPE').SESSION_CREATED;
      req.app.get('eventEmitter').emit(eventType, {
        id: sessionId,
        info: sessionInfo
      });
      res.status(200).send({
        token: token,
        encryptedKey: new Buffer(encryptedKey).toString('base64'),
        publicKey: new Buffer(assymetricKeyPair.publicKey).toString('base64'),
        permissions: authReq.permissions
      });
    } catch (e) {
      res.status(500).send(e.message);
    }
  }
  return this.onDirKey;
}

export var authorise = function(req, res) {
  let authReq = req.body;
  if (!(authReq.app && authReq.app.name && authReq.app.id && authReq.app.vendor &&
      authReq.app.version && authReq.publicKey && authReq.nonce)) {
    return res.status(400).send('Fields are missing');
  }

  var publicKeyLength = new Buffer(authReq.publicKey, 'base64').length;
  var nonceLength = new Buffer(authReq.nonce, 'base64').length;

  if (nonceLength !== sodium.crypto_box_NONCEBYTES) {
    return res.status(400).send('Invalid nonce');
  }
  if (publicKeyLength !== sodium.crypto_box_PUBLICKEYBYTES) {
    return res.status(400).send('Invalid public key');
  }

  let payload = {
    payload: authReq,
    request: req,
    response: res
  };
  let eventType = req.app.get('EVENT_TYPE').AUTH_REQUEST;
  req.app.get('eventEmitter').emit(eventType, payload);
}

export var revoke = function(req, res) {
  let sessionId = getSessionIdFromRequest(req);
  if (!sessionId) {
    return res.status(401).send('Authorisation Token could not be parsed');
  }
  if (!sessionManager.remove(sessionId)) {
    return res.status(400).send('Session not found');
  }
  let eventType = req.app.get('EVENT_TYPE').SESSION_REMOVED;
  req.app.get('eventEmitter').emit(eventType, sessionId);
  res.status(200).send("Session removed");
}
