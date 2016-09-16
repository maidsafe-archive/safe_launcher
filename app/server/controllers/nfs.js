import mime from 'mime';
import sessionManager from '../session_manager';
import { ResponseError, ResponseHandler } from '../utils';
import { log } from './../../logger/log';
import nfs from '../../ffi/api/nfs';
import { NfsWriter } from '../stream/nfs_writer';
import NfsReader from '../stream/nfs_reader';
import { errorCodeLookup } from './../error_code_lookup';
import util from 'util';
import { MSG_CONSTANTS } from './../message_constants';

const ROOT_PATH = {
  app: false,
  drive: true
};

const FILE_OR_DIR_ACTION = {
  copy: true,
  move: false
};

let deleteOrGetDirectory = function(req, res, isDelete, next) {
  const sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  const app = sessionInfo.app;

  const rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const dirPath = req.params['0'] || '/';
  const exec = async () => {
    const responseHandler = new ResponseHandler(req, res);
    try {
      if (isDelete) {
        if (dirPath === '/') {
          return next(new ResponseError(400, 'Cannot delete root directory'));
        }
        log.debug('NFS - Invoking delete directory request');
        await nfs.deleteDirectory(app, dirPath, rootPath);
        responseHandler();
      } else {
        log.debug('NFS  - Invoking get directory request');
        const directory = await nfs.getDirectory(app, dirPath, rootPath);
        responseHandler(null, directory);
      }
    } catch(e) {
      console.error(e);
      responseHandler(e);
    }
  };
  exec();
};

let move = function(req, res, isFile, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  const app = sessionInfo.app;

  let reqBody = req.body;
  if (!(reqBody.srcPath && reqBody.hasOwnProperty('srcRootPath') &&
      reqBody.destPath && reqBody.hasOwnProperty('destRootPath'))) {
    return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
  }
  let srcRootPath = ROOT_PATH[reqBody.srcRootPath.toLowerCase()];
  if (typeof srcRootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'srcRootPath')));
  }
  let destRootPath = ROOT_PATH[reqBody.destRootPath.toLowerCase()];
  if (typeof destRootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'destRootPath')));
  }
  reqBody.action = reqBody.action || 'MOVE';
  let action = FILE_OR_DIR_ACTION[reqBody.action.toLowerCase()];
  if (typeof action === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'action')));
  }
  const exec = async () => {
    const responseHandler = new ResponseHandler(req, res);
    try {
      if (isFile) {
        log.debug('NFS - Invoking move file request');
        await nfs.moveFile(app, reqBody.srcPath, srcRootPath, reqBody.destPath, destRootPath, action);
      } else {
        if (action === false && reqBody.srcPath === '/') {
          return next(new ResponseError(400, 'Cannot move root directory'));
        }
        log.debug('NFS - Invoking move directory request');
        await nfs.moveDir(app, reqBody.srcPath, srcRootPath, reqBody.destPath, destRootPath, action);
      }
      responseHandler();
    } catch(e) {
      console.error(e);
      responseHandler(e);
    }
  };
  exec();
};

export var createDirectory = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  const app = sessionInfo.app;
  let reqBody = req.body;
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  let dirPath = req.params['0'];
  if (!dirPath || dirPath === '/') {
    return next(new ResponseError(400, 'Directory path specified is not valid'));
  }
  reqBody.metadata = reqBody.metadata || '';
  reqBody.isPrivate = reqBody.isPrivate || false;
  if (typeof reqBody.metadata !== 'string') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'metadata')));
  }
  if (typeof reqBody.isPrivate !== 'boolean') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'isPrivate')));
  }
  log.debug('NFS - Invoking create directory request');
  let responseHandler = new ResponseHandler(req, res);
  nfs.createDirectory(app, dirPath, reqBody.metadata, reqBody.isPrivate, false, rootPath)
    .then(responseHandler, responseHandler, console.error);
};

export var deleteDirectory = function(req, res, next) {
  deleteOrGetDirectory(req, res, true, next);
};

export var getDirectory = function(req, res, next) {
  deleteOrGetDirectory(req, res, false, next);
};

export var modifyDirectory = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }

  let reqBody = req.body;
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  let dirPath = req.params['0'];
  if (!dirPath || dirPath === '/') {
    return next(new ResponseError(400, 'Directory path specified is not valid'));
  }
  reqBody.name = reqBody.name || '';
  reqBody.metadata = reqBody.metadata || '';

  if (!reqBody.name && !reqBody.metadata) {
    return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
  }
  if (typeof reqBody.metadata !== 'string') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'metadata')));
  }
  if (typeof reqBody.name !== 'string') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'name')));
  }
  let responseHandler = new ResponseHandler(req, res);
  log.debug('NFS - Invoking modify directory request');
  nfs.updateDirectory(sessionInfo.app, dirPath, rootPath, reqBody.name, reqBody.metadata)
    .then(responseHandler, responseHandler, responseHandler);
};

export var moveDirectory = function(req, res, next) {
  move(req, res, false, next);
};

export var createFile = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  const app = sessionInfo.app;
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  if (!req.headers['content-length'] || isNaN(req.headers['content-length'])) {
    return next(new ResponseError(400, 'Content-Length header is not present'));
  }
  let length = parseInt(req.headers['content-length']);
  let metadata = req.headers.metadata || '';
  if (typeof metadata !== 'string') {
    return next(new ResponseError(400, MSG_CONSTANTS.FAILURE.REQUIRED_PARAMS_MISSING));
  }
  log.debug('NFS - Invoking create file request');
  const responseHandler = new ResponseHandler(req, res);
  const onWriterObtained = (writerId) => {
    var writer = new NfsWriter(req, writerId, responseHandler, length);
    req.on('aborted', function() {
      next(new ResponseError(400, 'Request aborted by client'));
    });
    req.pipe(writer);
  };
  nfs.createFile(app, filePath, metadata, rootPath)
    .then(onWriterObtained, responseHandler, console.error);
};

export var deleteFile = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  let responseHandler = new ResponseHandler(req, res);
  log.debug('NFS - Invoking delete file request');
  nfs.deleteFile(sessionInfo.app, filePath, rootPath)
    .then(responseHandler, responseHandler, responseHandler);
};

export var modifyFileMeta = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  let reqBody = req.body;
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  reqBody.metadata = reqBody.metadata || '';
  reqBody.name = reqBody.name || '';
  if (typeof reqBody.metadata !== 'string') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'metadata')));
  }
  if (typeof reqBody.name !== 'string') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'name')));
  }
  let responseHandler = new ResponseHandler(req, res);
  log.debug('NFS - Invoking modify file metadata request');
  nfs.updateFileMetadata(sessionInfo.app, filePath, rootPath, reqBody.name, reqBody.metadata)
    .then(responseHandler, responseHandler, responseHandler);
};

export var getFile = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const responseHandler = new ResponseHandler(req, res);
  let onFileMetadataReceived = function(fileStats) {
    log.debug('NFS - File metadata for reading - ' + JSON.stringify(fileStats));
    let range = req.get('range');
    let positions = [ 0 ];
    if (range) {
      range = range.toLowerCase();
      if (!/^bytes=/.test(range)) {
        return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'range')));
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
    log.debug('NFS - Ready to stream file for range' + start + '-' + end + '/' + total);
    var headers = {
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
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
    let nfsReader = new NfsReader(req, res, filePath, rootPath, start, end, sessionInfo.app);
    nfsReader.pipe(res);
  };
  log.debug('NFS - Invoking get file request');
  nfs.getFileMetadata(sessionInfo.app, filePath, rootPath)
    .then(onFileMetadataReceived, responseHandler, console.error);
};

export var getFileMetadata = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return next(new ResponseError(401));
  }
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
  }
  const responseHandler = new ResponseHandler(req, res);
  let onFileMetadataReceived = function(fileStats) {
    log.debug('NFS - File metatda for reading - ' + JSON.stringify(fileStats));
    let headers = {
      'Accept-Ranges': 'bytes',
      'Created-On': fileStats.createdOn,
      'Last-Modified': fileStats.modifiedOn,
      'Metadata': fileStats.metadata,
      'Content-Type': mime.lookup(filePath) || 'application/octet-stream',
      'Content-Length': fileStats.size,
      metadata: fileStats.metadata
    };
    res.writeHead(200, headers);
    res.end();
  };
  log.debug('NFS - Invoking get file metadata request');
  nfs.getFileMetadata(sessionInfo.app, filePath, rootPath)
  .then(onFileMetadataReceived, responseHandler, console.error);
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
//     return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'rootPath')));
//   }
//   if (req.get('range')) {
//     var range = req.get('range').toLowerCase();
//     if (!/^bytes=/.test(range)) {
//       return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'range')));
//     }
//     var positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
//     offset = positions[0];
//   }
//   if (isNaN(offset)) {
//     return next(new ResponseError(400, util.format(MSG_CONSTANTS.FAILURE.FIELD_NOT_VALID, 'offset')));
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

export var moveFile = function(req, res, next) {
  move(req, res, true, next);
};
