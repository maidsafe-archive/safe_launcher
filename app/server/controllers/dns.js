import mime from 'mime';
import sessionManager from '../session_manager';
import { formatDirectoryResponse, formatResponse, ResponseError, ResponseHandler } from '../utils';
import { log } from './../../logger/log';
import { DnsReader } from '../stream/dns_reader';
import { errorCodeLookup } from './../error_code_lookup';
import util from 'util';
import { MSG_CONSTANTS } from './../message_constants';

const domainCheck = /^[a-z0-9][a-z0-9-]{1,60}[a-z0-9](?:)+$/;

const ROOT_PATH = {
  app: false,
  drive: true
};

var registerOrAddService = function(req, res, isRegister, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let reqBody = req.body;
  if (!reqBody.longName) {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_EMPTY, 'longName')));
  }
  if (!reqBody.serviceName) {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_EMPTY, 'serviceName')));
  }
  if (!reqBody.serviceHomeDirPath) {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_EMPTY, 'serviceHomeDirPath')));
  }
  if (!reqBody.rootPath) {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_EMPTY, 'rootPath')));
  }
  if (!domainCheck.test(reqBody.longName)) {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
  }
  if (!domainCheck.test(reqBody.serviceName)) {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'serviceName')));
  }
  if (!ROOT_PATH.hasOwnProperty(reqBody.rootPath)) {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  let isPathShared = ROOT_PATH[reqBody.rootPath];
  let responseHandler = new ResponseHandler(req, res);
  if (isRegister) {
    log.debug('DNS - Invoking register API for ' + JSON.stringify(reqBody));
    req.app.get('api').dns.register(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler);
  } else {
    log.debug('DNS - Invoking add service API for ' + JSON.stringify(reqBody));
    req.app.get('api').dns.addService(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler);
  }
};

export var getHomeDirectory = function(req, res, next) {
  let sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  let appDirKey = sessionInfo ? sessionInfo.appDirKey : null;
  let hasSafeDriveAccess = sessionInfo ? sessionInfo.hasSafeDriveAccess() : false;
  let longName = req.params.longName;
  let serviceName = req.params.serviceName;
  let responseHandler = new ResponseHandler(req, res);
  log.debug('DNS - Invoking getHomeDirectory API for ' + longName + ', ' + serviceName);
  req.app.get('api').dns.getHomeDirectory(longName, serviceName, hasSafeDriveAccess, appDirKey,
    function(err, dir) {
        if (err) {
          return responseHandler(err);
        }
        dir = formatDirectoryResponse(JSON.parse(dir));
        responseHandler(null, dir);
      });
};

export var getFile = function(req, res, next) {
  let sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  let appDirKey = sessionInfo ? sessionInfo.appDirKey : null;
  var reqParams = req.params;
  let hasSafeDriveAccess = sessionInfo ? sessionInfo.hasSafeDriveAccess() : false;
  let longName = reqParams.longName;
  let serviceName = reqParams.serviceName;
  let filePath = reqParams['0'];

  if (!(longName && serviceName && filePath)) {
    return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
  }
  let onFileMetadataReceived = function(err, fileStats) {
    log.debug('DNS - File metadata for reading - ' + (fileStats || JSON.stringify(err)));
    if (err) {
      log.error(err);
      return next(new ResponseError(400, err));
    }
    fileStats = formatResponse(fileStats);
    let range = req.get('range');
    let positions = [ 0 ];
    if (range) {
      range = range.toLowerCase();
      if (!/^bytes=/.test(range)) {
        return next(new ResponseError(416));
      }
      positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
      for (var i in positions) {
        if (isNaN(positions[i])) {
          return next(new ResponseError(416));
        }
      }
    }
    let start = parseInt(positions[0]);
    let total = fileStats.size;
    let end = (positions[1] && total) ? parseInt(positions[1]) : total;
    let chunksize = end - start;
    if (chunksize < 0 || end > total) {
      return next(new ResponseError(416));
    }
    log.debug('DNS - Ready to stream file for range' + start + '-' + end + '/' + total);
    var headers = {
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Created-On': fileStats.createdOn,
      'Last-Modified': fileStats.modifiedOn,
      'Content-Type': mime.lookup(filePath) || 'application/octet-stream'
    };
    if (fileStats.metadata && fileStats.metadata.length > 0) {
      headers.metadata = new Buffer(fileStats.metadata, 'base64').tostring('base64');
    }
    res.writeHead(range ? 206 : 200, headers);
    if (chunksize === 0) {
      return res.end();
    }
    let dnsReader = new DnsReader(req, res, longName, serviceName,
      filePath, start, end, hasSafeDriveAccess, appDirKey);
    dnsReader.pipe(res);
  };
  log.debug('DNS - Invoking getFile API for ' + longName + ', ' + serviceName + ', ' + filePath);
  req.app.get('api').dns.getFileMetadata(longName, serviceName, filePath, hasSafeDriveAccess, appDirKey,
    onFileMetadataReceived);
};

export var register = function(req, res, next) {
  registerOrAddService(req, res, true, next);
};

export var addService = function(req, res, next) {
  registerOrAddService(req, res, false, next);
};

export var deleteDns = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  let params = req.params;
  let responseHandler = new ResponseHandler(req, res);
  if (typeof params.longName !== 'string') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
  }
  log.debug('DNS - Invoking deleteDns API for ' + params.longName);
  req.app.get('api').dns.deleteDns(params.longName, sessionInfo.hasSafeDriveAccess(),
    sessionInfo.appDirKey, responseHandler);
};

export var deleteService = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  let params = req.params;

  if (typeof params.serviceName !== 'string') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'serviceName')));
  }
  if (typeof params.longName !== 'string') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
  }
  let responseHandler = new ResponseHandler(req, res);
  log.debug('DNS - Invoking deleteService API for ' + params.longName + ', ' + params.serviceName);
  req.app.get('api').dns.deleteService(params.longName, params.serviceName,
    sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler);
};

export var listLongNames = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  let responseHandler = new ResponseHandler(req, res);
  log.debug('DNS - Invoking listLongNames API');
  req.app.get('api').dns.listLongNames(sessionInfo.appDirKey, responseHandler);
};

export var listServices = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  let responseHandler = new ResponseHandler(req, res);
  log.debug('DNS - Invoking listServices API for ' + req.params.longName);
  req.app.get('api').dns.listServices(req.params.longName, sessionInfo.appDirKey, responseHandler);
};

export var createPublicId = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }

  if (!domainCheck.test(req.params.longName)) {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
  }
  let responseHandler = new ResponseHandler(req, res);
  log.debug('DNS - Invoking createPublicId API for ' + req.params.longName);
  req.app.get('api').dns.createPublicId(req.params.longName, sessionInfo.appDirKey, responseHandler);
};
