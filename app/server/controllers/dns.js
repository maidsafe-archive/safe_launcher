import mime from 'mime';
import sessionManager from '../session_manager';
import { ResponseHandler, formatResponse } from '../utils';
import { log } from './../../logger/log';
import { DnsReader } from '../stream/dns_reader';
import { errorCodeLookup } from './../error_code_lookup';

var domainCheck = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

var registerOrAddService = function(req, res, isRegister) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  let reqBody = req.body;
  if (!reqBody.longName) {
    return responseHandler.onResponse('Invalid request. \'longName\' can not be empty');
  }
  if (!reqBody.serviceName) {
    return responseHandler.onResponse('Invalid request. \'serviceName\' can not be empty');
  }
  if (!reqBody.serviceHomeDirPath) {
    return responseHandler.onResponse('Invalid request. \'serviceHomeDirPath\' can not be empty');
  }
  if (!domainCheck.test(reqBody.longName)) {
    return responseHandler.onResponse('Invalid request. \'longName\' is not valid');
  }
  if (!domainCheck.test(reqBody.serviceName)) {
    return responseHandler.onResponse('Invalid request. \'serviceName\' is not valid');
  }
  reqBody.isPathShared = reqBody.isPathShared || false;
  if (isRegister) {
    log.debug('DNS - Invoking register API for ' + JSON.stringify(reqBody));
    req.app.get('api').dns.register(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      reqBody.isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  } else {
    log.debug('DNS - Invoking add service API for ' + JSON.stringify(reqBody));
    req.app.get('api').dns.addService(reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      reqBody.isPathShared, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  }
};

export var getHomeDirectory = function(req, res) {
  let sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  let appDirKey = sessionInfo ? sessionInfo.appDirKey : null;
  let hasSafeDriveAccess = sessionInfo ? sessionInfo.hasSafeDriveAccess() : false;
  let longName = req.params.longName;
  let serviceName = req.params.serviceName;
  let responseHandler = new ResponseHandler(res);
  log.debug('DNS - Invoking getHomeDirectory API for ' + longName + ', ' + serviceName);
  req.app.get('api').dns.getHomeDirectory(longName, serviceName, hasSafeDriveAccess, appDirKey,
    responseHandler.onResponse);
};

export var getFile = function(req, res) {
  let sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
  let appDirKey = sessionInfo ? sessionInfo.appDirKey : null;
  var reqParams = req.params;
  let hasSafeDriveAccess = sessionInfo ? sessionInfo.hasSafeDriveAccess() : false;
  let longName = reqParams.longName;
  let serviceName = reqParams.serviceName;
  let filePath = reqParams['0'];
  let responseHandler = new ResponseHandler(res);
  if (!(longName && serviceName && filePath)) {
    return responseHandler.onResponse('Invalid request. Required parameters are not found');
  }
  let onFileMetadataReceived = function(err, fileStats) {
    log.debug('DNS - File metadata for reading - ' + (fileStats || JSON.stringify(err)));
    if (err) {
      log.error(err);
      return responseHandler.onResponse(err);
    }
    fileStats = formatResponse(fileStats);
    let range = req.get('range');
    let positions = [0];
    if (range) {
      range = range.toLowerCase();
      if (!/^bytes=/.test(range)) {
        return responseHandler.onResponse('Invalid range header specification.');
      }
      positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
      for (var i in positions) {
        if (isNaN(positions[i])) {
          return res.sendStatus(416);
        }
      }
    }
    let start = parseInt(positions[0]);
    let total = fileStats.size;
    let end = (positions[1] && total) ? parseInt(positions[1]) : total;
    let chunksize = end - start;
    if (chunksize < 0 || end > total) {
      return res.sendStatus(416);
    }
    log.debug('DNS - Ready to stream file for range' + start + "-" + end + "/" + total);
    var headers = {
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Created-On": new Date(fileStats.createdOn).toUTCString(),
      "Last-Modified": new Date(fileStats.modifiedOn).toUTCString(),
      "Content-Type": mime.lookup(filePath) || 'application/octet-stream'
    };
    if (fileStats.metadata) {
      headers.metadata = fileStats.metadata;
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

export var register = function(req, res) {
  registerOrAddService(req, res, true);
};

export var addService = function(req, res) {
  registerOrAddService(req, res, false);
};

export var deleteDns = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let params = req.params;
  let responseHandler = new ResponseHandler(res);
  if (!(typeof params.longName === 'string')) {
    return responseHandler.onResponse('Invalid request. \'longName\' is not valid');
  }
  log.debug('DNS - Invoking deleteDns API for ' + params.longName);
  req.app.get('api').dns.deleteDns(params.longName, sessionInfo.hasSafeDriveAccess(),
    sessionInfo.appDirKey, responseHandler.onResponse);
};

export var deleteService = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let params = req.params;
  let responseHandler = new ResponseHandler(res);
  if (!(typeof params.serviceName === 'string')) {
    return responseHandler.onResponse('Invalid request. \'serviceName\' is not valid');
  }
  if (!(typeof params.longName === 'string')) {
    return responseHandler.onResponse('Invalid request. \'longName\' is not valid');
  }
  log.debug('DNS - Invoking deleteService API for ' + params.longName + ', ' + params.serviceName);
  req.app.get('api').dns.deleteService(params.longName, params.serviceName,
    sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
};

export var listLongNames = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  log.debug('DNS - Invoking listLongNames API');
  req.app.get('api').dns.listLongNames(sessionInfo.appDirKey, responseHandler.onResponse);
};

export var listServices = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  log.debug('DNS - Invoking listServices API for ' + req.params.longName);
  req.app.get('api').dns.listServices(req.params.longName, sessionInfo.appDirKey, responseHandler.onResponse);
};

export var createPublicId = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  if (!domainCheck.test(req.params.longName)) {
    return responseHandler.onResponse('Invalid request. \'longName\' is not valid');
  }
  log.debug('DNS - Invoking createPublicId API for ' + req.params.longName);
  req.app.get('api').dns.createPublicId(req.params.longName, sessionInfo.appDirKey, responseHandler.onResponse);
};
