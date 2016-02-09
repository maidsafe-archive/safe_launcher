import jwt from 'jsonwebtoken';
import * as sodium from 'libsodium-wrappers';
import sessionManager from './session_manager';

export var getSessionIdFromRequest = function(req) {
  let authHeader = req.get('Authorization');
  if (!authHeader) {
    return;
  }
  if (authHeader.indexOf(' ') !== 6) {
    return;
  }
  authHeader = authHeader.split(' ');
  if (!(authHeader.length === 2 && authHeader[0].toLowerCase() === 'bearer')) {
    return;
  }
  let token = authHeader[1];
  let jwtSections = token.split('.');
  if (jwtSections.length !== 3) {
    return;
  }
  try {
    let payload = JSON.parse(new Buffer(jwtSections[1], 'base64').toString());
    let sessionInfo = sessionManager.get(payload.id);
    if (!sessionInfo) {
      return;
    }
    jwt.verify(token, new Buffer(sessionInfo.signingKey));
    return payload.id;
  } catch (e) {
    return;
  }
}

export var decryptRequest = function(req, res, next) {
  if (!req.get('Authorization')) {
    return next();
  }
  let sessionId = getSessionIdFromRequest(req);
  if (!sessionId) {
    return res.send(401, 'Unauthorised');
  }
  let sessionInfo = sessionManager.get(sessionId);
  try {
    // var path = new Uint8Array(new Buffer(req.path.substr(1), 'base64'));
    // req.url = new Buffer(sodium.crypto_secretbox_open_easy(path, sessionInfo.nonce, sessionInfo.secretKey)).toString();
    if (req.body) {
      req.body = new Uint8Array(new Buffer(req.body, 'base64'));
      req.body = new Buffer(sodium.crypto_secretbox_open_easy(req.body, sessionInfo.nonce, sessionInfo.secretKey)).toString();
      // req.headers['content-type'] = 'application/json';
    }
    req.headers['sessionId'] = sessionId;
    next();
  } catch(e) {
    return res.status(400).send('Failed to decrypt the request. ' + e.message());
  }

}
