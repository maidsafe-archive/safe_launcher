/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
import mime from 'mime';
import util from 'util';
import sessionManager from '../session_manager';
import { ResponseError, ResponseHandler, parseExpectionMsg } from '../utils';
import log from './../../logger/log';
import dns from '../../ffi/api/dns';
import { DnsReader } from '../stream/dns_reader';
import { MSG_CONSTANTS } from './../message_constants';

const domainCheck = /^[a-z0-9][a-z0-9-]{1,60}[a-z0-9](?:)+$/;

const ROOT_PATH = {
  app: false,
  drive: true
};

const registerOrAddService = (req, res, isRegister, next) => {
  log.debug(`DNS - ${req.id} :: ${isRegister ? 'Register' : 'Add Service'}`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`DNS - ${req.id} :: ${isRegister ? 'Register' : 'Add Service'} 
      :: Unauthorised request`);
    return res.sendStatus(401);
  }
  const reqBody = req.body;
  if (!reqBody.longName) {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_EMPTY, 'longName')));
  }
  if (!reqBody.serviceName) {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_EMPTY, 'serviceName')));
  }
  if (!reqBody.serviceHomeDirPath) {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_EMPTY, 'serviceHomeDirPath')));
  }
  if (!reqBody.rootPath) {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_EMPTY, 'rootPath')));
  }
  if (!domainCheck.test(reqBody.longName)) {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
  }
  if (!domainCheck.test(reqBody.serviceName)) {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'serviceName')));
  }
  if (!ROOT_PATH.hasOwnProperty(reqBody.rootPath.toLowerCase())) {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const isPathShared = ROOT_PATH[reqBody.rootPath.toLowerCase()];
  const responseHandler = new ResponseHandler(req, res);
  if (isRegister) {
    log.debug(`DNS - ${req.id} :: Invoking register API for ${JSON.stringify(reqBody)}`);
    dns.registerService(sessionInfo.app, reqBody.longName, reqBody.serviceName,
      reqBody.serviceHomeDirPath, isPathShared).then(responseHandler, responseHandler);
    log.debug(`DNS - ${req.id} :: Registered`);
  } else {
    log.debug(`DNS - ${req.id} :: Invoking add service API for ${JSON.stringify(reqBody)}`);
    dns.addService(sessionInfo.app, reqBody.longName, reqBody.serviceName,
      reqBody.serviceHomeDirPath, isPathShared).then(responseHandler, responseHandler);
    log.debug(`DNS - ${req.id} :: Service added`);
  }
};

export const getHomeDirectory = async(req, res) => {
  log.debug(`DNS - ${req.id} :: Get home directory`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
    const app = sessionInfo ? sessionInfo.app : null;
    const longName = req.params.longName;
    const serviceName = req.params.serviceName;
    log.debug(`DNS - Invoking Get home directory API for ${longName}, ${serviceName}`);
    const directory = await dns.getServiceDirectory(app, longName, serviceName);
    log.debug(`DNS - ${req.id} :: Home directory obtained`);
    responseHandler(null, directory);
  } catch (e) {
    log.warn(`DNS - ${req.id} :: Invoking Get home directory :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    return responseHandler(e);
  }
};

export const getFile = async(req, res, next) => {
  log.debug(`DNS - ${req.id} :: Get file`);
  try {
    const sessionInfo = req.headers.sessionId ? sessionManager.get(req.headers.sessionId) : null;
    const app = sessionInfo ? sessionInfo.app : null;
    const reqParams = req.params;
    const longName = reqParams.longName;
    const serviceName = reqParams.serviceName;
    const filePath = reqParams['0'];
    if (!(longName && serviceName && filePath)) {
      return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
    }
    const fileStats = await dns.getFileMetadata(app, longName, serviceName, filePath);
    let range = req.get('range');
    let positions = [0];
    if (range) {
      range = range.toLowerCase();
      if (!/^bytes=/.test(range)) {
        log.error(`DNS - ${req.id} :: Get file - Range not in bytes`);
        return next(new ResponseError(416));
      }
      positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
      for (const i in positions) {
        if (isNaN(positions[i])) {
          log.error(`DNS - ${req.id} :: Get file - Range positions is not numeric`);
          return next(new ResponseError(416));
        }
      }
    }
    const start = parseInt(positions[0], 10);
    const total = fileStats.size;
    const end = ((positions[1] && total) && (positions[1] < total)) ?
      parseInt(positions[1], 10) : total;
    const chunksize = end - start;
    if (chunksize < 0 || end > total) {
      log.error(`DNS - ${req.id} :: Get file - Invalid range`);
      return next(new ResponseError(416));
    }
    log.debug(`DNS - ${req.id} :: Ready to stream file for range ${start} - ${end} / ${total}`);
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${total}`,
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
    const dnsReader = new DnsReader(req, res, longName, serviceName,
      filePath, start, end, app);
    dnsReader.pipe(res);
  } catch (e) {
    log.warn(`DNS - ${req.id} :: Get file :: Caught exception - ${parseExpectionMsg(e)}`);
    new ResponseHandler(req, res)(e);
  }
};

export const register = (req, res, next) => {
  registerOrAddService(req, res, true, next);
};

export const addService = (req, res, next) => {
  registerOrAddService(req, res, false, next);
};

export const deleteDns = async(req, res, next) => {
  log.debug(`DNS - ${req.id} :: Delete DNS`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: Delete DNS :: Unauthorised error`);
      return next(new ResponseError(401));
    }
    const params = req.params;
    if (typeof params.longName !== 'string') {
      return next(new ResponseError(400,
        util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
    }
    log.debug(`DNS - ${req.id} :: Invoking Delete DNS API for ${params.longName}`);
    await dns.deleteLongName(sessionInfo.app, params.longName);
    log.debug(`DNS - ${req.id} :: DNS deleted`);
    responseHandler();
  } catch (e) {
    log.warn(`DNS - ${req.id} :: Delete DNS :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const deleteService = async(req, res, next) => {
  log.debug(`DNS - ${req.id} :: Delete service`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: Delete service :: Unauthorised error`);
      return next(new ResponseError(401));
    }
    const params = req.params;

    if (typeof params.serviceName !== 'string') {
      return next(new ResponseError(400,
        util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'serviceName')));
    }
    if (typeof params.longName !== 'string') {
      return next(new ResponseError(400,
        util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
    }
    log.debug(`DNS - Invoking Delete Service API for ${params.longName}, ${params.serviceName}`);
    await dns.deleteService(sessionInfo.app, params.longName, params.serviceName);
    log.debug(`DNS - ${req.id} :: Service deleted`);
    responseHandler();
  } catch (e) {
    log.warn(`DNS - ${req.id} :: Delete Service :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const listLongNames = async(req, res, next) => {
  log.debug(`DNS - ${req.id} :: List longnames`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: List longnames :: Unauthorised error`);
      return next(new ResponseError(401));
    }
    log.debug(`DNS - ${req.id} :: Invoking listLongNames`);
    const longNames = await dns.listLongNames(sessionInfo.app);
    log.debug(`DNS - ${req.id} :: Longnames list obtained`);
    responseHandler(null, longNames);
  } catch (e) {
    log.warn(`DNS - ${req.id} :: List longnames :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const listServices = async(req, res, next) => {
  log.debug(`DNS - ${req.id} :: List service`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: List service :: Unauthorised error`);
      return next(new ResponseError(401));
    }
    log.debug(`DNS - ${req.id} :: Invoking listServices API for ${req.params.longName}`);
    const services = await dns.listServices(sessionInfo.app, req.params.longName);
    log.debug(`DNS - ${req.id} :: Service list obtained`);
    responseHandler(null, services);
  } catch (e) {
    log.warn(`DNS - ${req.id} :: List service :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const createPublicId = async(req, res, next) => {
  log.debug(`DNS - ${req.id} :: Create Public Id`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`DNS - ${req.id} :: Create Public Id :: Unauthorised error`);
      return next(new ResponseError(401));
    }

    if (!domainCheck.test(req.params.longName)) {
      return next(new ResponseError(400,
        util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'longName')));
    }

    log.debug(`DNS - ${req.id} :: Invoking createPublicId API for ${req.params.longName}`);
    await dns.registerLongName(sessionInfo.app, req.params.longName);
    log.debug(`DNS - ${req.id} :: Public Id created`);
    responseHandler();
  } catch (e) {
    log.warn(`DNS - ${req.id} :: Create Public Id :: Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};
