/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */
import mime from 'mime';
import util from 'util';
import sessionManager from '../session_manager';
import { ResponseError, ResponseHandler, parseExpectionMsg } from '../utils';
import log from './../../logger/log';
import nfs from '../../ffi/api/nfs';
import { NfsWriter } from '../stream/nfs_writer';
import NfsReader from '../stream/nfs_reader';
import { MSG_CONSTANTS } from './../message_constants';

const ROOT_PATH = {
  app: false,
  drive: true
};

const FILE_OR_DIR_ACTION = {
  copy: true,
  move: false
};

const deleteOrGetDirectory = (req, res, isDelete, next) => {
  log.debug(`NFS - ${req.id} :: ${isDelete ? 'DELETE' : 'GET'} directory`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`NFS - ${req.id} :: ${isDelete ? 'DELETE' : 'GET'} directory :: 
      Unauthorised request`);
    return next(new ResponseError(401));
  }
  const app = sessionInfo.app;

  const rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const dirPath = req.params['0'] || '/';
  const exec = async() => {
    const responseHandler = new ResponseHandler(req, res);
    try {
      if (isDelete) {
        if (dirPath === '/') {
          return next(new ResponseError(400, 'Cannot delete root directory'));
        }
        log.debug(`NFS - ${req.id} :: Invoking delete directory request`);
        await nfs.deleteDirectory(app, dirPath, rootPath);
        log.debug(`NFS - ${req.id} :: Directory deleted`);
        responseHandler();
      } else {
        log.debug(`NFS  - ${req.id} :: Invoking get directory request`);
        const directory = await nfs.getDirectory(app, dirPath, rootPath);
        log.debug(`NFS - ${req.id} :: Directory obtained`);
        responseHandler(null, directory);
      }
    } catch (e) {
      log.warn(`NFS - ${req.id} :: ${isDelete ? 'DELETE' : 'GET'} directory :: 
        Caught exception - ${parseExpectionMsg(e)}`);
      responseHandler(e);
    }
  };
  exec();
};

const move = (req, res, isFile, next) => {
  log.debug(`NFS - ${req.id} :: MOVE ${isFile ? 'file' : 'directory'}`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`NFS - ${req.id} :: MOVE ${isFile ? 'file' : 'directory'} :: Unauthorised request`);
    return next(new ResponseError(401));
  }
  const app = sessionInfo.app;

  const reqBody = req.body;
  if (!(reqBody.srcPath && reqBody.hasOwnProperty('srcRootPath') &&
    reqBody.destPath && reqBody.hasOwnProperty('destRootPath'))) {
    return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
  }
  const srcRootPath = ROOT_PATH[reqBody.srcRootPath.toLowerCase()];
  if (typeof srcRootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'srcRootPath')));
  }
  const destRootPath = ROOT_PATH[reqBody.destRootPath.toLowerCase()];
  if (typeof destRootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'destRootPath')));
  }
  reqBody.action = reqBody.action || 'MOVE';
  const action = FILE_OR_DIR_ACTION[reqBody.action.toLowerCase()];
  if (typeof action === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'action')));
  }
  const exec = async() => {
    const responseHandler = new ResponseHandler(req, res);
    try {
      if (isFile) {
        log.debug(`NFS - ${req.id} :: 
          Invoking move file request - ${JSON.stringify(reqBody)}`);
        await nfs.moveFile(app, reqBody.srcPath, srcRootPath,
          reqBody.destPath, destRootPath, action);
        log.debug(`NFS - ${req.id} :: 
          File ${action === FILE_OR_DIR_ACTION.move ? 'moved' : 'copied'}`);
      } else {
        if (action === false && reqBody.srcPath === '/') {
          return next(new ResponseError(400, 'Cannot move root directory'));
        }
        log.debug(`NFS - ${req.id} :: 
          Invoking move directory request - ${JSON.stringify(reqBody)}`);
        await nfs.moveDir(app, reqBody.srcPath,
          srcRootPath, reqBody.destPath, destRootPath, action);
        log.debug(`NFS - ${req.id} :: 
          Directory ${action === FILE_OR_DIR_ACTION.move ? 'moved' : 'copied'}`);
      }
      responseHandler();
    } catch (e) {
      log.warn(`NFS - ${req.id} :: MOVE ${isFile ? 'file' : 'directory'} :: 
        Caught exception - ${parseExpectionMsg(e)}`);
      responseHandler(e);
    }
  };
  exec();
};

export const createDirectory = (req, res, next) => {
  log.debug(`NFS - ${req.id} :: Create directory`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`NFS - ${req.id} :: Create Directory :: Unauthorised request`);
    return next(new ResponseError(401));
  }
  const app = sessionInfo.app;
  const reqBody = req.body;
  const rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const dirPath = req.params['0'];
  if (!dirPath || dirPath === '/') {
    return next(new ResponseError(400, 'Directory path specified is not valid'));
  }
  reqBody.metadata = reqBody.metadata || '';
  reqBody.isPrivate = reqBody.isPrivate || false;
  if (typeof reqBody.metadata !== 'string') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'metadata')));
  }
  if (typeof reqBody.isPrivate !== 'boolean') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'isPrivate')));
  }
  log.debug(`NFS - ${req.id} :: Invoking create directory request - ${JSON.stringify(reqBody)}`);
  const responseHandler = new ResponseHandler(req, res);
  nfs.createDirectory(app, dirPath, reqBody.metadata, reqBody.isPrivate, false, rootPath)
    .then(responseHandler, responseHandler,
      (e) => log.error(`NFS - ${req.id} :: Create Directory :: ${e}`));
};

export const deleteDirectory = (req, res, next) => {
  deleteOrGetDirectory(req, res, true, next);
};

export const getDirectory = (req, res, next) => {
  deleteOrGetDirectory(req, res, false, next);
};

export const modifyDirectory = (req, res, next) => {
  log.debug(`NFS - ${req.id} :: Modify directory`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`NFS - ${req.id} :: Modify directory :: Unauthorised request`);
    return next(new ResponseError(401));
  }
  const reqBody = req.body;
  const rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const dirPath = req.params['0'];
  if (!dirPath || dirPath === '/') {
    return next(new ResponseError(400, 'Directory path specified is not valid'));
  }
  reqBody.name = reqBody.name || '';
  reqBody.metadata = reqBody.metadata || '';

  if (!reqBody.name && !reqBody.metadata) {
    return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
  }
  if (typeof reqBody.metadata !== 'string') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'metadata')));
  }
  if (typeof reqBody.name !== 'string') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'name')));
  }
  const responseHandler = new ResponseHandler(req, res);
  log.debug(`NFS - ${req.id} :: Invoking modify directory request -  ${JSON.stringify(reqBody)}`);
  nfs.updateDirectory(sessionInfo.app, dirPath, rootPath, reqBody.name, reqBody.metadata)
    .then(responseHandler, responseHandler, responseHandler);
};

export const moveDirectory = (req, res, next) => {
  move(req, res, false, next);
};

export const createFile = (req, res, next) => {
  log.debug(`NFS - ${req.id} :: Create file`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`NFS - ${req.id} :: Create File :: Unauthorised request`);
    return next(new ResponseError(401));
  }
  const app = sessionInfo.app;
  const filePath = req.params['0'];
  const rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  if (!req.headers['content-length'] || isNaN(req.headers['content-length'])) {
    return next(new ResponseError(400, 'Content-Length header is not present'));
  }
  const length = parseInt(req.headers['content-length'], 10);
  const metadata = req.headers.metadata || '';
  if (typeof metadata !== 'string') {
    return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
  }
  log.debug(`NFS - ${req.id} :: Invoking create file request 
    - ${JSON.stringify({ metadata, length })}`);
  const responseHandler = new ResponseHandler(req, res);
  const onWriterObtained = (writerId) => {
    const writer = new NfsWriter(req, writerId, responseHandler, length);
    req.on('aborted', () => {
      next(new ResponseError(400, 'Request aborted by client'));
    });
    req.pipe(writer);
  };
  nfs.createFile(app, filePath, metadata, rootPath)
    .then(onWriterObtained, responseHandler,
      (e) => log.error(`NFS - ${req.id} :: Create File :: ${e}`));
};

export const deleteFile = (req, res, next) => {
  log.debug(`NFS - ${req.id} :: Delete file`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`NFS - ${req.id} :: Delete File :: Unauthorised request`);
    return next(new ResponseError(401));
  }
  const filePath = req.params['0'];
  const rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const responseHandler = new ResponseHandler(req, res);
  log.debug(`NFS - ${req.id} :: Invoking delete file request`);
  nfs.deleteFile(sessionInfo.app, filePath, rootPath)
    .then(responseHandler, responseHandler, responseHandler);
};

export const modifyFileMeta = (req, res, next) => {
  log.debug(`NFS - ${req.id} :: Modify file metadata`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`NFS - ${req.id} :: Modify File Meta API :: Unauthorised request`);
    return next(new ResponseError(401));
  }
  const reqBody = req.body;
  const filePath = req.params['0'];
  const rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  if (!reqBody.name && !reqBody.metadata) {
    return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
  }
  reqBody.metadata = reqBody.metadata || '';
  reqBody.name = reqBody.name || '';
  if (typeof reqBody.metadata !== 'string') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'metadata')));
  }
  if (typeof reqBody.name !== 'string') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'name')));
  }
  const responseHandler = new ResponseHandler(req, res);
  log.debug(`NFS - ${req.id} :: Invoking modify file metadata request 
    - ${JSON.stringify(reqBody)}`);
  nfs.updateFileMetadata(sessionInfo.app, filePath, rootPath, reqBody.name, reqBody.metadata)
    .then(responseHandler, responseHandler, responseHandler);
};

export const getFile = (req, res, next) => {
  log.debug(`NFS - ${req.id} :: Get file`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`NFS - ${req.id} :: Get file :: Unauthorised request`);
    return next(new ResponseError(401));
  }
  const filePath = req.params['0'];
  const rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const responseHandler = new ResponseHandler(req, res);
  const onFileMetadataReceived = fileStats => {
    log.debug(`NFS - ${req.id} :: File metadata for reading - ${JSON.stringify(fileStats)}`);
    let range = req.get('range');
    let positions = [0];
    if (range) {
      range = range.toLowerCase();
      if (!/^bytes=/.test(range)) {
        return next(new ResponseError(400,
          util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'range')));
      }
      positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
      for (const i in positions) {
        if (isNaN(positions[i])) {
          return next(new ResponseError(416));
        }
      }
    }
    const start = parseInt(positions[0], 10);
    const total = fileStats.size;
    const end = (positions[1] && total) ? parseInt(positions[1], 10) : total;
    const chunksize = end - start;
    if (chunksize < 0 || end > total) {
      return next(new ResponseError(416));
    }
    log.debug(`NFS - ${req.id} :: Ready to stream file for range ${start} - ${end} / ${total}`);
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Created-On': fileStats.createdOn,
      'Last-Modified': fileStats.modifiedOn,
      'Content-Type': mime.lookup(filePath) || 'application/octet-stream',
      metadata: fileStats.metadata
    };
    res.writeHead(range ? 206 : 200, headers);
    if (chunksize === 0) {
      return res.end();
    }
    const nfsReader = new NfsReader(req, res, filePath, rootPath, start, end, sessionInfo.app);
    nfsReader.pipe(res);
  };
  log.debug(`NFS - ${req.id} :: Invoking get file request`);
  nfs.getFileMetadata(sessionInfo.app, filePath, rootPath)
    .then(onFileMetadataReceived, responseHandler,
      (e) => log.error(`NFS - ${req.id} :: Get file :: ${e}`));
};

export const getFileMetadata = (req, res, next) => {
  log.debug(`NFS - ${req.id} :: Get file metadata`);
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    log.error(`NFS - ${req.id} :: Get File Metadata :: Unauthorised request`);
    return next(new ResponseError(401));
  }
  const filePath = req.params['0'];
  const rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400,
      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const responseHandler = new ResponseHandler(req, res);
  const onFileMetadataReceived = (fileStats) => {
    log.debug(`NFS - File metatda for reading - ${JSON.stringify(fileStats)}`);
    const headers = {
      'Accept-Ranges': 'bytes',
      'Created-On': fileStats.createdOn,
      'Last-Modified': fileStats.modifiedOn,
      'Content-Type': mime.lookup(filePath) || 'application/octet-stream',
      'Content-Length': fileStats.size,
      metadata: fileStats.metadata
    };
    res.writeHead(200, headers);
    res.end();
  };
  log.debug(`NFS - ${req.id} :: Invoking get file metadata request`);
  nfs.getFileMetadata(sessionInfo.app, filePath, rootPath)
    .then(onFileMetadataReceived, responseHandler,
      (e) => log.error(`NFS - ${req.id} :: Get file metadata :: ${e}`));
};

// export var modifyFileContent = function(req, res, next) {
//   let sessionInfo = sessionManager.get(req.headers.sessionId);
//   if (!sessionInfo) {
//     return next(new ResponseError(401));
//   }
//   let offset = 0;
//   let filePath = req.params['0'];
//   let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
//   if (typeof rootPath === 'undefined') {
//     return next(new ResponseError(400,
//       util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
//   }
//   if (req.get('range')) {
//     var range = req.get('range').toLowerCase();
//     if (!/^bytes=/.test(range)) {
//       return next(new ResponseError(400,
//        util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'range')));
//     }
//     var positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
//     offset = positions[0];
//   }
//   if (isNaN(offset)) {
//     return next(new ResponseError(400,
//      util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'offset')));
//   }
//   log.debug('NFS - Invoking modify file content request');
//   req.app.get('api').nfs.getWriter(filePath, isPathShared,
//     sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, function(err, writerId) {
//     var responseHandler = new ResponseHandler(req, res);
//     if (err) {
//       return responseHandler(err);
//     }
//     var writer = new NfsWriter(req, writerId, responseHandler, offset);
//     req.on('end', function() {
//       writer.onClose();
//     });
//     req.pipe(writer);
//   });
// };

export const moveFile = (req, res, next) => {
  move(req, res, true, next);
};
