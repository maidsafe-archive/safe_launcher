import jwt from 'jsonwebtoken';
import mime from 'mime';
import * as sodium from 'libsodium-wrappers';
import sessionManager from './session_manager';
import { errorCodeLookup } from './error_code_lookup';
import { log } from './../logger/log';

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
    log.debug('Unauthorised Request ::' + req.path);
    return next();
  }
  log.debug('Authorised Request ::' + req.path);
  let sessionId = getSessionIdFromRequest(req);
  log.debug('Decrypted session id :: ' + sessionId);
  if (!sessionId) {
    log.warn('Session Id not found');
    return res.sendStatus(401);
  }
  let sessionInfo = sessionManager.get(sessionId);
  let parseQueryString = function(string) {
    string = string.split('&');
    var json = {};
    string.forEach(function(val) {
      val = val.split('=');
      json[val[0]] = val[1];
    });
    return json;
  };
  try {
    // var path = new Uint8Array(new Buffer(req.path.substr(1), 'base64'));
    // req.url = new Buffer(sodium.crypto_secretbox_open_easy(path, sessionInfo.nonce, sessionInfo.secretKey)).toString();
    if (req.body && Object.keys(req.body).length > 0) {
      log.debug('Decrypting Request Body');
      let reqBodyUIntArray = new Uint8Array(new Buffer(req.body, 'base64'));
      let reqBody = sodium.crypto_secretbox_open_easy(reqBodyUIntArray, sessionInfo.nonce, sessionInfo.secretKey);
      req.body = new Buffer(reqBody);
      log.debug('Decrypted Request Body ' + reqBody);
    }
    if (Object.keys(req.query).length > 0) {
      log.debug('Decrypting Request Query Parameters');
      var query = Object.keys(req.query)[0];
      let queryUIntArray = new Uint8Array(new Buffer(query, 'base64'));
      let reqQuery = sodium.crypto_secretbox_open_easy(queryUIntArray, sessionInfo.nonce, sessionInfo.secretKey);
      reqQuery = new Buffer(reqQuery).toString();
      log.debug('Decrypted Request Query Params :: ' + reqQuery);
      reqQuery = parseQueryString(reqQuery);
      req.query = reqQuery;
    }
    req.headers['sessionId'] = sessionId;
    next();
  } catch (e) {
    log.error('Decryption Error - Authorised Request - ' + e.message);
    return res.sendStatus(401);
  }
}

export var formatResponse = function(data) {
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  let format = function(data) {
    var type = typeof data;
    switch (type) {
      case 'object':
        return (data.constructor === Array) ? formatList(data) : formatObject(data);
      default:
        return data;
    }
  };

  let convertToCamelCase = function(key) {
    if (!key || key.indexOf('_') === -1) {
      return key;
    }
    let temp;
    let keys = key.split('_');
    let newKey = '';
    for (let i in keys) {
      if (i === '0') {
        newKey = keys[i];
        continue;
      }
      temp = keys[i];
      newKey += (temp.substr(0, 1).toUpperCase() + temp.substr(1));
    }
    return newKey;
  };

  let formatObject = function(obj) {
    let computeTime = function(seconds, nanoSeconds) {
      return (seconds * 1000) + Math.floor(nanoSeconds / 1000000);
    };
    if (obj.hasOwnProperty('creation_time_sec')) {
      obj.createdOn = computeTime(obj.creation_time_sec, obj.creation_time_nsec);
      delete obj.creation_time_sec;
      delete obj.creation_time_nsec;
    }
    if (obj.hasOwnProperty('modification_time_sec')) {
      obj.modifiedOn = computeTime(obj.modification_time_sec, obj.modification_time_nsec);
      delete obj.modification_time_sec;
      delete obj.modification_time_nsec;
    }
    if (obj.hasOwnProperty('user_metadata')) {
      obj.metadata = obj.user_metadata;
      delete obj.user_metadata;
    }
    if (obj.hasOwnProperty('metadata') && typeof obj.metadata === 'string' && obj.metadata) {
      obj.metadata = (obj.metadata && obj.metadata[0] === '{') ? JSON.parse(obj.metadata) : obj.metadata;
    }
    var formattedObj = {};
    for (let key in obj) {
      formattedObj[convertToCamelCase(key)] = format(obj[key]);
    }
    return formattedObj;
  };

  let formatList = function(list) {
    var formattedList = [];
    for (let i in list) {
      formattedList.push(format(list[i]));
    }
    return formattedList;
  };

  return format(data);
}

export var ResponseHandler = function(res, sessionInfo, isFileResponse) {
  let self = this;
  self.res = res;
  self.sessionInfo = sessionInfo;
  self.isFileResponse = isFileResponse || false;

  var encrypt = function(msg) {
    if (!self.sessionInfo) {
      return msg;
    }
    return self.sessionInfo.encryptResponse(msg);
  };

  var generalResponse = function(err, data) {
    let status = 200;
    if (err) {
      if (err.hasOwnProperty('errorCode')) {
        err.description = errorCodeLookup(err.errorCode);
      }
      if (err.description && err.description.toLowerCase().indexOf('notfound') > -1) {
        status = 404;
      }
      err = encrypt(err);
      return self.res.status(400).send(err);
    }
    if (data) {
      self.res.status(status).send(encrypt(formatResponse(data)));
    } else {
      self.res.sendStatus(status);
    }
  };

  var fileResponse = function(err, data) {
    var status = 200;
    if (err) {
      status = 400;
      if (err.hasOwnProperty('errorCode')) {
        err.description = errorCodeLookup(err.errorCode);
      }
      if (err.description && err.description.toLowerCase().indexOf('notfound') > -1) {
        status = 404;
      }
      err = encrypt(err);
      return self.res.status(status).send(err);
    }
    data = formatResponse(data);
    var content = new Buffer(data.content, 'base64');
    if (sessionInfo) {
      content = sessionInfo.encryptBuffer(content);
      self.res.set('Content-Type', 'text/plain');
    } else {
      self.res.set('Content-Type', mime.lookup(data.metadata.name));
    }
    self.res.set('file-name', data.metadata.name);
    self.res.set('file-size', data.metadata.size);
    self.res.set('file-created-time', data.metadata.createdOn);
    self.res.set('file-modified-time', data.metadata.modifiedOn);
    if (data.metadata.userMetadata) {
      self.res.set('file-metadata', data.metadata.userMetadata);
    }
    res.status(status).send(content);
  };

  self.onResponse = self.isFileResponse ? fileResponse : generalResponse;

  return self;
};
