/*jslint nomen: true */
import path from 'path';
import http from 'http';
import express from 'express';
import EventEmitter from 'events';
import bodyParser from 'body-parser';
import sessionManager from './session_manager';
/*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
import { router_0_5 } from './routes/version_0_5';
/*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
import { CreateSession } from './controllers/auth';
import { formatResponse, ResponseError, setSessionHeaderAndParseBody, updateAppActivity } from './utils';
import { log } from './../logger/log';

class ServerEventEmitter extends EventEmitter {}

export default class RESTServer {
  constructor(api, port, callback) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.callback = callback || function() {};
    this.EVENT_TYPE = {
      ERROR: 'error',
      STARTED: 'started',
      STOPPED: 'stopped',
      AUTH_REQUEST: 'auth_request',
      ACTIVITY_NEW: 'activity_new',
      ACTIVITY_UPDATE: 'activity_update',
      SESSION_CREATED: 'sesssion_created',
      SESSION_REMOVED: 'session_removed',
      SESSION_CREATION_FAILED: 'session_creation_failed',
      DATA_UPLOADED: 'data_uploaded',
      DATA_DOWNLOADED: 'data_downloaded'
    };
    this.app.set('api', api);
    this.app.set('eventEmitter', new ServerEventEmitter());
    this.app.set('EVENT_TYPE', this.EVENT_TYPE);
  }
  /* jscs:disable disallowDanglingUnderscores*/
  _onError(type, eventEmitter) {
    return function(error) {
      if (error.syscall !== 'listen') {
        throw error;
      }
      eventEmitter.emit(type, error);
    };
  }

  _onClose(type, eventEmitter) {
    return function() {
      eventEmitter.emit(type);
    };
  }

  _onListening(type, eventEmitter) {
    return function() {
      eventEmitter.emit(type);
    };
  }
  /* jscs:enable disallowDanglingUnderscores*/

  start() {
    let app = this.app;
    let EVENT_TYPE = this.app.get('EVENT_TYPE');
    let eventEmitter = this.app.get('eventEmitter');

    app.use(bodyParser.urlencoded({
      extended: false
    }));

    app.use(setSessionHeaderAndParseBody);

    app.use('/health', function(req, res) {
      res.sendStatus(200);
    });
    app.get('/pac-file', function(req, res) {
      res.download(path.resolve(__dirname, 'server/web_proxy.pac'));
    });
    /*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
    app.use('/', router_0_5);
    app.use('/0.5', router_0_5);
    /*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/

    // API Error handling
    app.use(function(err, req, res, next) {
      if (!(err instanceof ResponseError)) {
        return next();
      }
      updateAppActivity(req, res);
      log.warn('Err ' + err.status + ' - Msg :: ' + err.msg);
      res.status(err.status).send(err.msg);
    });

    // catch 404
    app.use(function(err, req, res) {
      if (res.headersSent) {
        return;
      }
      if (typeof res === 'function') {
        return req.status(404).send({ errorCode: 404, description: 'Endpoint Not Found' });
      }
      res.status(500).send(err);
    });

    app.set('port', this.port);
    this.server = http.createServer(app);
    this.server.timeout = 0;
    this.server.listen(this.port, this.callback);
    /* jscs:disable disallowDanglingUnderscores*/
    this.server.on('error', this._onError(this.EVENT_TYPE.ERROR, eventEmitter));
    this.server.on('close', this._onClose(this.EVENT_TYPE.STOPPED, eventEmitter));
    this.server.on('listening', this._onListening(this.EVENT_TYPE.STARTED, eventEmitter));
    /* jscs:enable disallowDanglingUnderscores*/
  }

  stop() {
    if (!this.server) {
      return;
    }
    this.server.close();
  }

  removeSession(id) {
    sessionManager.remove(id);
    this.app.get('eventEmitter').emit(this.EVENT_TYPE.SESSION_REMOVED, id);
  }

  clearAllSessions() {
    sessionManager.clear();
  }

  addEventListener(event, listener) {
    this.app.get('eventEmitter').addListener(event, listener);
  }

  removeAllEventListener(event) {
    this.app.get('eventEmitter').removeAllListeners(event);
  }

  authApproved(data) {
    var app = data.payload.app;
    this.app.get('api').auth.getAppDirectoryKey(app.id, app.name, app.vendor, new CreateSession(data));
  }

  getAppActivityList(sessionId) {
    let sessionInfo = sessionManager.get(sessionId);
    return sessionInfo ? sessionInfo.activityList : null;
  }

  authRejected(payload) {
    updateAppActivity(payload.request, payload.response);
    payload.response.status(401).send('Unauthorised');
  }
}
