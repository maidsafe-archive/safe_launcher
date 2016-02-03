import path from 'path'
import http from 'http';
import express from 'express';
import * as logger from 'morgan';
import EventEmitter from 'events';
import bodyParser from 'body-parser';
import sessionManager from './session_manager';

var routesVersion1 = require('./server/routes/version_1');
var server;

class ServerEventEmitter extends EventEmitter {};

var eventEmitter = new ServerEventEmitter();

export var EVENT_TYPE = {
  ERROR: 'error',
  STARTED: 'started',
  STOPPED: 'stopped',
  SESSION_CREATED: 'sesssion_created',
  SESSION_REMOVED: 'session_removed'
};

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  eventEmitter.emit(EVENT_TYPE.ERROR, error);
};

function onClose() {
  eventEmitter.emit(EVENT_TYPE.STOPPED);
};

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  eventEmitter.emit(EVENT_TYPE.STARTED, server.address().port);
};

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/v1', routesVersion1);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.end();
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.end();
});

export var startServer = function() {
  var port = process.env.PORT || '3000';
  app.set('port', port);
  server = http.createServer(app);
  server.listen(port);
  server.on('error', onError);
  server.on('close', onClose);
  server.on('listening', onListening);
};

export var stopServer = function() {
  if (!server) {
    return;
  }
  server.close();
};

export var removeSession = function(id) {
  sessionManager.remove(id);  
  eventEmitter.emit(EVENT_TYPE.SESSION_REMOVED, id);
};

export var addEventListener = function(event, listener) {
  eventEmitter.addListener(event, listener);
}
