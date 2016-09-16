import jwt from 'jsonwebtoken';
import mime from 'mime';
import uuid from 'uuid';
import sessionManager from './session_manager';
import { errorCodeLookup } from './error_code_lookup';
import { log } from './../logger/log';
import { MSG_CONSTANTS } from './message_constants';
import { Activity, ActivityStatus } from './model/activity';

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
    console.error(e);
    return;
  }
};

export var formatDirectoryResponse = function(dir) {
  /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
  delete dir.info.is_versioned;
  dir.sub_directories.forEach(function(info) {
    delete info.is_versioned;
  });
  /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
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

export let ResponseHandler = function(req, res) {
  this.onResponse = function(err, data) {
    if (err) {
      return req.next(new ResponseError(400, err));
    }
    updateAppActivity(req, res, true);
    let successStatus = 200;
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
      } catch(e) {
        console.error(e);
      }
    } else {
      res.sendStatus(successStatus);
    }
  };

  return this.onResponse;
};

export var setSessionHeaderAndParseBody = function(req, res, next) {
  req.id = uuid.v4();
  req.time = Date.now();
  res.id = req.id;
  if (!req.get('Authorization')) {
    log.debug('Unauthorised request ::' + req.path);
    return next();
  }
  log.debug('Authorised request ::' + req.path);
  let sessionId = getSessionIdFromRequest(req);
  log.debug('Decrypted session id :: ' + sessionId);
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
      return new Date((seconds * 1000) + Math.floor(nanoSeconds / 1000000)).toISOString();
    };
    if (obj.hasOwnProperty('created_time_sec')) {
      /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
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
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
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
};

export let addAppActivity = function(req, activityName) {
  let activity = new Activity(req.id, activityName, Date.now());
  let sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  req.app.get('eventEmitter').emit(req.app.get('EVENT_TYPE').ACTIVITY_NEW, {
    app: req.headers.sessionId,
    appName: sessionInfo ? sessionInfo.appName : null,
    activity: activity
  });
  if (req.headers.sessionId) {
    sessionManager.get(req.headers.sessionId).addActivity(activity);
  }
  req.activity = activity;
};

export let updateAppActivity = function(req, res, isSuccess) {
  let activity = req.activity;
  activity.endTime = Date.now();
  activity.activityStatus = isSuccess ? ActivityStatus.SUCCESS : ActivityStatus.FAILURE;
  let sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  req.app.get('eventEmitter').emit(req.app.get('EVENT_TYPE').ACTIVITY_UPDATE, {
    app: req.headers.sessionId,
    appName: sessionInfo ? sessionInfo.appName : null,
    activity: activity
  });
  if (req.headers.sessionId && sessionInfo) {
    sessionManager.get(req.headers.sessionId).updateActivity(activity);
  }
};
