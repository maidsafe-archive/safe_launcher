'use strict';

import util from 'util';
import jwt from 'jsonwebtoken';
import * as sodium from 'libsodium-wrappers';
import sessionManager from '../session_manager';
import SessionInfo from '../model/session_info';

export var createSession = function(req, res) {
  let authReq = req.body;
  let onDirKey = function(err, dirKey) {
    let assymetricKeyPair = sodium.crypto_box_keypair();
    if (err) {
      return res.send(500, error.message());
    }
    var app = authReq.app;
    let appPubKey = new Uint8Array(new Buffer(authReq.publicKey, 'base64'));
    let appNonce = new Uint8Array(new Buffer(authReq.nonce, 'base64'));
    let sessionId = new Buffer(sodium.randombytes_buf(32)).toString('base64');
    let sessionInfo = new SessionInfo(app.id, app.name, app.version, app.vendor, authReq.permissions, dirKey);
    let encryptedKey = sodium.crypto_box_easy(sessionInfo.secretKey, appNonce, appPubKey, assymetricKeyPair.privateKey);
    let token = jwt.sign(sessionId, new Buffer(sessionInfo.signingKey).toString('base64'));
    sessionManager.put(sessionId, sessionInfo);
    res.send(200, {
      token: token,
      encryptedKey: new Buffer(encryptedKey).toString('base64'),
      publicKey: new Buffer(assymetricKeyPair.publicKey).toString('base64'),
      permissions: permissions
    });
  }
  return onDirKey;
}

export var authorise = function (req, res) {
  let authReq = req.body;
  if (!(authReq.app && authReq.app.name && authReq.app.id && authReq.app.vendor &&
      authReq.app.version && authReq.publicKey && authReq.nonce)) {
    return res.send(400, 'Bad request');
  }

  var payload = {
    payload: authReq,
    request: req,
    response: res
  };
  var eventType = req.app.get('EVENT_TYPE').AUTH_REQUEST;
  req.app.get('eventEmitter').emit(eventType, payload);
}
