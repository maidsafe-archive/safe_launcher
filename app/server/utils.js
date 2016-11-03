/* eslint-disable no-param-reassign */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
import jwt from 'jsonwebtoken';
import uuid from 'uuid';
import sessionManager from './session_manager';
import { errorCodeLookup } from './error_code_lookup';
import log from './../logger/log';
import { MSG_CONSTANTS } from './message_constants';
import { Activity, ActivityStatus } from './model/activity';

export const getSessionIdFromRequest = req => {
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
  const token = authHeader[1];
  const jwtSections = token.split('.');
  if (jwtSections.length !== 3) {
    return;
  }
  try {
    const payload = JSON.parse(new Buffer(jwtSections[1], 'base64').toString());
    const sessionInfo = sessionManager.get(payload.id);
    if (!sessionInfo) {
      return;
    }
    jwt.verify(token, new Buffer(sessionInfo.signingKey));
    return payload.id;
  } catch (e) {
    log.warn(`Get Session Id from request error :: ${parseExpectionMsg(e)}`);
  }
};

export const formatDirectoryResponse = dir => {
  delete dir.info.is_versioned;
  dir.sub_directories.forEach(info => delete info.is_versioned);
  return dir;
};

export class ResponseError {
  constructor(status, message) {
    message = message || MSG_CONSTANTS.ERROR_CODE[status];
    if (!isNaN(message) && message < 0) {
      message = {
        errorCode: message
      };
    }
    if (typeof message === 'object' && message.hasOwnProperty('errorCode')) {
      message.description = errorCodeLookup(message.errorCode);
      if (message.description.toLowerCase().indexOf('notfound') > -1 ||
        message.description.toLowerCase().indexOf('pathnotfound') > -1 ||
        message.description.toLowerCase().indexOf('nosuchdata') > -1 ||
        message.description.toLowerCase().indexOf('invalidpath') > -1) {
        status = 404;
      }
    } else {
      message = {
        errorCode: 400,
        description: message
      };
    }
    this.errStatus = status;
    this.msg = message;
  }

  get status() {
    return this.errStatus;
  }

  get message() {
    return this.msg;
  }
}
/* eslint-disable func-names */
export const ResponseHandler = function (req, res) {
  this.onResponse = (err, data) => {
    if (err) {
      if (err instanceof Error) {
        err = err.message || err;
      }
      return req.next(new ResponseError(400, err));
    }
    updateAppActivity(req, res, true);
    const successStatus = 200;
    if (res.headersSent) {
      return;
    }
    if (data) {
      res.status(successStatus).send(data);
      try {
        let length = 0;
        if (data.hasOwnProperty(length)) {
          length = data.length;
        } else {
          length = JSON.stringify(data).length;
        }
        req.app.get('eventEmitter').emit(req.app.get('EVENT_TYPE').DATA_DOWNLOADED, length);
      } catch (e) {
        log.warn(`Response Handler error :: ${parseExpectionMsg(e)}`);
      }
    } else {
      res.sendStatus(successStatus);
    }
  };

  return this.onResponse;
};
/* eslint-enable func-names */

export const setSessionHeaderAndParseBody = (req, res, next) => {
  req.id = uuid.v4();
  req.time = Date.now();
  res.id = req.id;
  if (!req.get('Authorization')) {
    log.debug(`Unauthorised request :: ${req.id} :: Path - ${req.path}`);
    return next();
  }
  log.debug(`Authorised request :: ${req.id} :: Path - ${req.path}`);
  const sessionId = getSessionIdFromRequest(req);
  log.debug(`Authorised request :: ${req.id} :: Decrypted session id - ${sessionId}`);
  if (!sessionId) {
    log.warn('Session ID not found');
    return res.sendStatus(401);
  }
  req.headers.sessionId = sessionId;
  // TODO remove this manual parsing code - map parser in routes
  if (req.body && req.body.length > 0) {
    req.body = ((req.body instanceof Buffer) ? JSON.parse(req.body.toString()) : req.body);
    if (typeof req.body !== 'object') {
      return res.status(400).send('Invalid request body');
    }
  }
  next();
};

export const formatResponse = data => {
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  const format = d => {
    const type = typeof d;
    switch (type) {
      case 'object':
        return (d.constructor === Array) ? formatList(d) : formatObject(d);
      default:
        return d;
    }
  };

  const convertToCamelCase = key => {
    if (!key || key.indexOf('_') === -1) {
      return key;
    }
    let temp;
    const keys = key.split('_');
    let newKey = '';
    for (const i in keys) {
      if (i === '0') {
        newKey = keys[i];
        continue;
      }
      temp = keys[i];
      newKey += (temp.substr(0, 1).toUpperCase() + temp.substr(1));
    }
    return newKey;
  };

  let formatObject = obj => {
    const computeTime = (seconds, nanoSeconds) => (
      new Date((seconds * 1000) + Math.floor(nanoSeconds / 1000000)).toISOString()
    );
    if (obj.hasOwnProperty('created_time_sec')) {
      obj.createdOn = computeTime(obj.created_time_sec, obj.created_time_nsec);
      delete obj.created_time_sec;
      delete obj.created_time_nsec;
    } else if (obj.hasOwnProperty('creation_time_sec')) {
      obj.createdOn = computeTime(obj.creation_time_sec, obj.creation_time_nsec);
      delete obj.creation_time_sec;
      delete obj.creation_time_nsec;
    }
    if (obj.hasOwnProperty('modified_time_sec')) {
      obj.modifiedOn = computeTime(obj.modified_time_sec, obj.modified_time_nsec);
      delete obj.modified_time_sec;
      delete obj.modified_time_nsec;
    } else if (obj.hasOwnProperty('modification_time_sec')) {
      obj.modifiedOn = computeTime(obj.modification_time_sec, obj.modification_time_nsec);
      delete obj.modification_time_sec;
      delete obj.modification_time_nsec;
    }
    if (obj.hasOwnProperty('user_metadata')) {
      obj.metadata = obj.user_metadata;
      delete obj.user_metadata;
    }
    if (obj.hasOwnProperty('metadata') && typeof obj.metadata === 'string' && obj.metadata) {
      obj.metadata = (obj.metadata && obj.metadata[0] === '{') ?
        JSON.parse(obj.metadata) : obj.metadata;
    }
    const formattedObj = {};
    for (const key in obj) {
      if (key) {
        formattedObj[convertToCamelCase(key)] = format(obj[key]);
      }
    }
    return formattedObj;
  };

  let formatList = list => {
    const formattedList = [];
    for (const i in list) {
      if (i) {
        formattedList.push(format(list[i]));
      }
    }
    return formattedList;
  };

  return format(data);
};

export const addAppActivity = (req, activityName) => {
  const appActivity = new Activity(req.id, activityName, Date.now());
  const sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  req.app.get('eventEmitter').emit(req.app.get('EVENT_TYPE').ACTIVITY_NEW, {
    app: req.headers.sessionId,
    appName: sessionInfo ? sessionInfo.appName : null,
    activity: appActivity
  });
  if (req.headers.sessionId) {
    sessionManager.get(req.headers.sessionId).addActivity(appActivity);
  }
  req.activity = appActivity;
};

export const updateAppActivity = (req, res, isSuccess) => {
  const appActivity = req.activity;
  appActivity.endTime = Date.now();
  appActivity.activityStatus = isSuccess ? ActivityStatus.SUCCESS : ActivityStatus.FAILURE;
  const sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  req.app.get('eventEmitter').emit(req.app.get('EVENT_TYPE').ACTIVITY_UPDATE, {
    app: req.headers.sessionId,
    appName: sessionInfo ? sessionInfo.appName : null,
    activity: appActivity
  });
  if (req.headers.sessionId && sessionInfo) {
    sessionManager.get(req.headers.sessionId).updateActivity(appActivity);
  }
};

export const parseExpectionMsg = e => (
  (typeof e.message === 'object') ? JSON.stringify(e.message) : e.message
);
