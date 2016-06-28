import path from 'path';
import http from 'http';
import express from 'express';
import EventEmitter from 'events';
import bodyParser from 'body-parser';
import sessionManager from './session_manager';
import { router_0_5 } from './routes/version_0_5';
import { CreateSession } from './controllers/auth';
import { setSessionHeaderAndParseBody } from './utils';

class ServerEventEmitter extends EventEmitter {};

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

    // var corsValidator = function(req, callback) {
    //   try {
    //     var origin = req.get('Origin');
    //     callback(null, {
    //       origin: (origin ? /\.safenet$/.test(origin) : true)
    //     });
    //   } catch (e) {
    //     callback(e);
    //   }
    // };
    //
    // app.options('*', cors(corsValidator));
    // app.use(cors(corsValidator));
    // app.use(function(req, res, next) {
    //   res.header("Access-Control-Allow-Origin", "*");
    //   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    //   res.header("Access-Control-Allow-Methods", "DELETE, GET, OPTIONS, POST, PUT");
    //   next();
    // });

    app.use(bodyParser.json({strict: false}));

    app.use(setSessionHeaderAndParseBody);

    app.use(bodyParser.urlencoded({
      extended: false
    }));

    app.get('/pac-file', function(req, res) {
      res.download(path.resolve(__dirname, 'server/web_proxy.pac'));
    });
    app.use('/', router_0_5);
    app.use('/0.5', router_0_5);

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
    app.set('port', this.port);
    this.server = http.createServer(app);
    this.server.listen(this.port, this.callback);
    this.server.on('error', this._onError(this.EVENT_TYPE.ERROR, eventEmitter));
    this.server.on('close', this._onClose(this.EVENT_TYPE.STOPPED, eventEmitter));
    this.server.on('listening', this._onListening(this.EVENT_TYPE.STARTED, eventEmitter));
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

  authRejected(payload) {
    payload.response.status(401).send('Unauthorised');
  }
}
