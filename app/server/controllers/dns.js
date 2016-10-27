import mime from 'mime';
import sessionManager from '../session_manager';
import { formatDirectoryResponse, formatResponse, ResponseError, ResponseHandler, parseExpectionMsg } from '../utils';
import { log } from './../../logger/log';
import dns from '../../ffi/api/dns';
import { DnsReader } from '../stream/dns_reader';
import { errorCodeLookup } from './../error_code_lookup';
import util from 'util';
import { MSG_CONSTANTS } from './../message_constants';

const domainCheck = /^[a-z0-9][a-z0-9-]{1,60}[a-z0-9](?:)+$/;

const ROOT_PATH = {
  app: false,
  drive: true
};

const registerOrAddService = (req, res, isRegister, next) => {
  log.debug(`DNS - ${req.id} :: ${isRegister ? 'Register' : 'Add Service'} API`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`DNS - ${req.id} :: ${isRegister ? 'Register' : 'Add Service'} API :: Unauthorised request`);
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
  if (!ROOT_PATH.hasOwnProperty(reqBody.rootPath.toLowerCase())) {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  let isPathShared = ROOT_PATH[reqBody.rootPath.toLowerCase()];
  let responseHandler = new ResponseHandler(req, res);
  if (isRegister) {
    log.debug(`DNS - ${req.id} :: Invoking register API for ${JSON.stringify(reqBody)}`);
    dns.registerService(sessionInfo.app, reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      isPathShared).then(responseHandler, responseHandler);
  } else {
    log.debug(`DNS - ${req.id} :: Invoking add service API for ${JSON.stringify(reqBody)}`);
    dns.addService(sessionInfo.app, reqBody.longName, reqBody.serviceName, reqBody.serviceHomeDirPath,
      isPathShared).then(responseHandler, responseHandler);
  }
};

export const getHomeDirectory = async (req, res, next) => {
  log.debug(`DNS - ${req.id} :: Get Home Directory API`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
    const app = sessionInfo ? sessionInfo.app : null;
    let longName = req.params.longName;
    let serviceName = req.params.serviceName;
    log.debug(`DNS - Invoking getHomeDirectory API for ${longName}, ${serviceName}`);
    const directory = await dns.getServiceDirectory(app, longName, serviceName);
    responseHandler(null, directory);
  } catch(e) {
    log.warn(`DNS - ${req.id} :: Invoking getHomeDirectory API error :: ${parseExpectionMsg(e)}`);
    return responseHandler(e);
  }
};

export const getFile = async (req, res, next) => {
  log.debug(`DNS - ${req.id} :: Get File`);
  try {
    let sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
    let app = sessionInfo ? sessionInfo.app : null;
    var reqParams = req.params;
    let longName = reqParams.longName;
    let serviceName = reqParams.serviceName;
    let filePath = reqParams['0'];
    if (!(longName && serviceName && filePath)) {
      return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
    }
    const fileStats = await dns.getFileMetadata(app, longName, serviceName, filePath);
    let range = req.get('range');
    let positions = [ 0 ];
    if (range) {
      range = range.toLowerCase();
      if (!/^bytes=/.test(range)) {
        log.error(`DNS - ${req.id} :: Get File range not in bytes`);
        return next(new ResponseError(416));
      }
      positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
      for (var i in positions) {
        if (isNaN(positions[i])) {
          log.error(`DNS - ${req.id} :: Get File range positions is not numeric`);
          return next(new ResponseError(416));
        }
      }
    }
    let start = parseInt(positions[0]);
    let total = fileStats.size;
    let end = (positions[1] && total) ? parseInt(positions[1]) : total;
    let chunksize = end - start;
    if (chunksize < 0 || end > total) {
      log.error(`DNS - ${req.id} :: Get File invalid range`);
      return next(new ResponseError(416));
    }
    log.debug(`DNS - ${req.id} :: Ready to stream file for range ${start} - ${end} / ${total}`);
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
      log.debug(`DNS - ${req.id} :: Get empty file`);
      return res.end();
    }
    let dnsReader = new DnsReader(req, res, longName, serviceName,
      filePath, start, end, app);
    dnsReader.pipe(res);
  } catch(e) {
    log.warn(`DNS - ${req.id} :: Get File error :: ${parseExpectionMsg(e)}`);
    new ResponseHandler(req, res)(e);
  }
};

export const register = function(req, res, next) {
  registerOrAddService(req, res, true, next);
};

export const addService = function(req, res, next) {
  registerOrAddService(req, res, false, next);
};

export const deleteDns = async (req, res, next) => {
  log.debug(`DNS - ${req.id} :: Delete DNS`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    let sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: Delete DNS API :: Unauthorised error`);
      return next(new ResponseError(401));
    }
    let params = req.params;
    if (typeof params.longName !== 'string') {
      return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
    }
    log.debug(`DNS - ${req.id} :: Invoking deleteDns API for ${params.longName}`);
    await dns.deleteLongName(sessionInfo.app, params.longName);
    responseHandler();
  } catch(e) {
    log.warn(`DNS - ${req.id} :: Delete DNS API error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export var deleteService = async (req, res, next) => {
  log.debug(`DNS - ${req.id} :: Delete Service`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    let sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: Delete Service API :: Unauthorised error`);
      return next(new ResponseError(401));
    }
    let params = req.params;

    if (typeof params.serviceName !== 'string') {
      return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'serviceName')));
    }
    if (typeof params.longName !== 'string') {
      return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
    }
    log.debug(`DNS - Invoking deleteService API for ${params.longName}, ${params.serviceName}`);
    await dns.deleteService(sessionInfo.app, params.longName, params.serviceName);
    responseHandler();
  } catch(e) {
    log.warn(`DNS - ${req.id} :: Delete Service API error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const listLongNames = async (req, res, next) => {
  log.debug(`DNS - ${req.id} :: List longnames`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    let sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: List longnames API :: Unauthorised error`);
      return next(new ResponseError(401));
    }
    log.debug(`DNS - ${req.id} :: Invoking listLongNames API`);
    const longNames = await dns.listLongNames(sessionInfo.app);
    responseHandler(null, longNames);
  } catch(e) {
    log.warn(`DNS - ${req.id} :: List longnames API error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const listServices = async (req, res, next) => {
  log.debug(`DNS - ${req.id} List Service`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    let sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: List service names API :: Unauthorised error`);
      return next(new ResponseError(401));
    }
    log.debug(`DNS - ${req.id} :: Invoking listServices API for ${req.params.longName}`);
    const services = await dns.listServices(sessionInfo.app, req.params.longName);
    responseHandler(null, services);
  } catch(e) {
    log.warn(`DNS - ${req.id} :: List service names API error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export var createPublicId = async (req, res, next) => {
  log.debug(`DNS - ${req.id} :: Create Public ID`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    let sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: Create Public Id API :: Unauthorised error`);
      return next(new ResponseError(401));
    }

    if (!domainCheck.test(req.params.longName)) {
      return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
    }

    log.debug(`DNS - ${req.id} :: Invoking createPublicId API for ${req.params.longName}`);
    await dns.registerLongName(sessionInfo.app, req.params.longName);
    responseHandler();
  } catch(e) {
    log.warn(`DNS - ${req.id} :: Create Public Id API error :: ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};
