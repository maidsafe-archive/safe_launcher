import path from 'path'
import http from 'http';
import express from 'express';
import EventEmitter from 'events';
import bodyParser from 'body-parser';
import sessionManager from './session_manager';
import { versionOneRouter } from './routes/version_one';
import { createSession } from './controllers/auth';
import { decryptRequest } from './utils';

class ServerEventEmitter extends EventEmitter {};

export default class RESTServer {
  constructor(api) {
    this.app = express();
    this.server = null;
    this.EVENT_TYPE = {
      ERROR: 'error',
      STARTED: 'started',
      STOPPED: 'stopped',
      AUTH_REQUEST: 'auth-request',
      SESSION_CREATED: 'sesssion_created',
      SESSION_REMOVED: 'session_removed'
    };
    this.app.set('api', api);
    this.app.set('eventEmitter', new ServerEventEmitter());
    this.app.set('EVENT_TYPE', this.EVENT_TYPE);
  }

  _onError(type, eventEmitter) {
      return function(error) {
          if (error.syscall !== 'listen') {
            throw error;
          }
          eventEmitter.emit(type, error);
      }
  }

  _onClose(type, eventEmitter) {
    return function() {
        eventEmitter.emit(type);
    }
  }

  _onListening(type, eventEmitter) {
    return function() {
        eventEmitter.emit(type);
    }
  }

  start() {
    let app = this.app;
    let EVENT_TYPE = this.app.get('EVENT_TYPE');
    let eventEmitter = this.app.get('eventEmitter');

    // app.use(function(req, res, next){
    //   if (req.is('text/*')) {
    //     req.body = '';
    //     req.setEncoding('utf8');
    //     req.on('data', function(chunk){ req.body += chunk });
    //     req.on('end', next);
    //   } else {
    //     next();
    //   }
    // });

    app.use(bodyParser.json({strict: false}));
    app.use(decryptRequest);
    app.use(bodyParser.urlencoded({
      extended: false
    }));

    app.use('/', versionOneRouter);
    app.use('/v1', versionOneRouter);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
    });

    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.send('Server Error');
    });

    var port = process.env.PORT || '3000';
    app.set('port', port);
    this.server = http.createServer(app);
    this.server.listen(port);
    this.server.on('error', this._onError(EVENT_TYPE.ERROR, eventEmitter));
    this.server.on('close', this._onClose(EVENT_TYPE.STOPPED, eventEmitter));
    this.server.on('listening', this._onListening(EVENT_TYPE.STARTED, eventEmitter));
  }

  stop() {
    if (!server) {
      return;
    }
    server.close();
  }

  removeSession(id) {
    sessionManager.remove(id);
    this.app.get('eventEmitter').emit(EVENT_TYPE.SESSION_REMOVED, id);
  }

  addEventListener(event, listener) {
    this.app.get('eventEmitter').addListener(event, listener);
  }

  removeAllEventListener(event) {
    this.app.get('eventEmitter').removeAllListeners(event);
  }

  authApproved(data) {
    var app = data.payload.app;
    this.app.get('api').auth.getAppDirectoryKey(app.id, app.name, app.vendor, new createSession(data.request, data.response));
  }

  authRejected(payload) {
    payload.response.status(401).send('Unauthorised');
  }
}
