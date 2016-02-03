import path from 'path'
import http from 'http';
import express from 'express';
import * as logger from 'morgan';
import EventEmitter from 'events';
import bodyParser from 'body-parser';
import sessionManager from './session_manager';
import versionOneRouter from './routes/version_one';

class ServerEventEmitter extends EventEmitter {};

export default class RESTServer {
  constructor(api) {
    this.api = api;
    this.server = null;
    this.eventEmitter = new ServerEventEmitter();
    this.EVENT_TYPE = {
      ERROR: 'error',
      STARTED: 'started',
      STOPPED: 'stopped',
      SESSION_CREATED: 'sesssion_created',
      SESSION_REMOVED: 'session_removed'
    };
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
    var app = express();

    app.use(logger('dev'));
    app.use(bodyParser.json());
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
    app.set('api', this.api);
    app.set('eventEmitter', this.eventEmitter);
    this.server = http.createServer(app);
    this.server.listen(port);
    this.server.on('error', this._onError(this.EVENT_TYPE.ERROR, this.eventEmitter));
    this.server.on('close', this._onClose(this.EVENT_TYPE.STOPPED, this.eventEmitter));
    this.server.on('listening', this._onListening(this.EVENT_TYPE.STARTED, this.eventEmitter));
  }

  stop() {
    if (!server) {
      return;
    }
    server.close();
  }

  removeSession(id) {
    sessionManager.remove(id);
    this.eventEmitter.emit(EVENT_TYPE.SESSION_REMOVED, id);
  }

  addEventListener(event, listener) {
    this.eventEmitter.addListener(event, listener);
  }
}
