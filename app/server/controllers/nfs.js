import fs from 'fs';
import mime from 'mime';
import sessionManager from '../session_manager';
import { ResponseHandler, formatResponse } from '../utils';
import { log } from './../../logger/log';
import { NfsWriter } from '../stream/nfs_writer';
import { NfsReader } from '../stream/nfs_reader';
import { errorCodeLookup } from './../error_code_lookup';

const ROOT_PATH = {
  app: false,
  drive: true
};

const FILE_OR_DIR_ACTION = {
  copy: true,
  move: false
};

let deleteOrGetDirectory = function(req, res, isDelete) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'rootPath\' mismatch');
  }
  let dirPath = req.params['0'];
  if (isDelete) {
    log.debug('NFS - Invoking delete directory request');
    req.app.get('api').nfs.deleteDirectory(dirPath, rootPath,
      sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  } else {
    log.debug('NFS  - Invoking get directory request');
    req.app.get('api').nfs.getDirectory(dirPath, rootPath,
      sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  }
}

let move = function(req, res, isFile) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  let reqBody = req.body;
  if (!(reqBody.srcPath && reqBody.hasOwnProperty('srcRootPath') &&
      reqBody.destPath && reqBody.hasOwnProperty('destRootPath'))) {
    return responseHandler.onResponse('Invalid request. Mandatory parameters are missing');
  }
  let srcRootPath = ROOT_PATH[reqBody.srcRootPath.toLowerCase()];
  if (typeof srcRootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'srcRootPath\' mismatch');
  }
  let destRootPath = ROOT_PATH[reqBody.destRootPath.toLowerCase()];
  if (typeof destRootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'destRootPath\' mismatch');
  }
  reqBody.action = reqBody.action || 'MOVE';
  let action = FILE_OR_DIR_ACTION[reqBody.action.toLowerCase()];
  if (typeof action === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'action\' mismatch');
  }
  if (isFile) {
    log.debug('NFS - Invoking move file request');
    req.app.get('api').nfs.moveFile(reqBody.srcPath, srcRootPath, reqBody.destPath, destRootPath,
      action, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  } else {
    log.debug('NFS - Invoking move directory request');
    req.app.get('api').nfs.moveDir(reqBody.srcPath, srcRootPath, reqBody.destPath, destRootPath,
      action, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, responseHandler.onResponse);
  }
}

export var createDirectory = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  let reqBody = req.body;
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'rootPath\' mismatch');
  }
  let dirPath = req.params['0'];
  reqBody.metadata = reqBody.metadata || '';
  reqBody.isPrivate = reqBody.isPrivate || false;
  if (typeof reqBody.metadata !== 'string') {
    return responseHandler.onResponse('Invalid request. \'metadata\' should be a string value');
  }
  if (typeof reqBody.isPrivate !== 'boolean') {
    return responseHandler.onResponse('Invalid request. \'isPrivate\' should be a boolean value');
  }
  let appDirKey = sessionInfo.appDirKey;
  log.debug('NFS - Invoking create directory request');
  req.app.get('api').nfs.createDirectory(dirPath, reqBody.isPrivate, false,
    reqBody.metadata, rootPath, sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey,
    responseHandler.onResponse);
}

export var deleteDirectory = function(req, res) {
  deleteOrGetDirectory(req, res, true);
}

export var getDirectory = function(req, res) {
  deleteOrGetDirectory(req, res, false);
};

export var modifyDirectory = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  let reqBody = req.body;
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'rootPath\' mismatch');
  }
  let dirPath = req.params['0'];
  reqBody.name = reqBody.name || '';
  reqBody.metadata = reqBody.metadata || '';

  if (!reqBody.name && !reqBody.metadata) {
    return responseHandler.onResponse('Invalid request. \'name\' or \'metadata\' should be present in the request');
  }
  if (typeof reqBody.metadata !== 'string') {
    return responseHandler.onResponse('Invalid request. \'metadata\' should be a string value');
  }
  if (typeof reqBody.name !== 'string') {
    return responseHandler.onResponse('Invalid request. \'name\' should be a string value');
  }
  log.debug('NFS - Invoking modify directory request');
  req.app.get('api').nfs.modifyDirectory(reqBody.name, reqBody.metadata, dirPath, rootPath,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), responseHandler.onResponse);
};

export var moveDirectory = function(req, res) {
  move(req, res, false);
}

export var createFile = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  let reqBody = req.body;
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'rootPath\' mismatch');
  }
  reqBody.metadata = reqBody.metadata || '';
  if (typeof reqBody.metadata !== 'string') {
    return responseHandler.onResponse('Invalid request. \'metadata\' should be a string value');
  }
  log.debug('NFS - Invoking create file request');
  req.app.get('api').nfs.createFile(filePath, reqBody.metadata, rootPath,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), responseHandler.onResponse);
};

export var deleteFile = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sensStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'rootPath\' mismatch');
  }
  log.debug('NFS - Invoking delete file request');
  req.app.get('api').nfs.deleteFile(filePath, rootPath, sessionInfo.appDirKey,
    sessionInfo.hasSafeDriveAccess(), responseHandler.onResponse);
};

export var modifyFileMeta = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  let reqBody = req.body;
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'rootPath\' mismatch');
  }
  reqBody.metadata = reqBody.metadata || '';
  reqBody.name = reqBody.name || '';
  if (typeof reqBody.metadata !== 'string') {
    return responseHandler.onResponse('Invalid request. \'metadata\' should be a string value');
  }
  if (typeof reqBody.name !== 'string') {
    return responseHandler.onResponse('Invalid request. \'name\' should be a string value');
  }
  log.debug('NFS - Invoking modify file metadata request');
  req.app.get('api').nfs.modifyFileMeta(reqBody.name, reqBody.metadata, filePath, rootPath,
    sessionInfo.appDirKey, sessionInfo.hasSafeDriveAccess(), responseHandler.onResponse);
};

export var getFile = function(req, res, next) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let responseHandler = new ResponseHandler(res);
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'rootPath\' mismatch');
  }

  let onFileMetadataRecieved = function(err, fileStats) {
    log.debug('NFS - File metadata for reading - ' + (fileStats || JSON.stringify(err)));
    if (err) {
      let status = 400;
      if (err.errorCode) {
        err.description = errorCodeLookup(err.errorCode);
      }
      log.error(err);
      if (err.description && (err.description.toLowerCase().indexOf('invalidpath') > -1 ||
          err.description.toLowerCase().indexOf('pathnotfound') > -1)) {
        status = 404;
      }
      return res.status(status).send(err);
    }
    fileStats = formatResponse(fileStats);
    let range = req.get('range');
    let positions = [0];
    if (range) {
      range = range.toLowerCase();
      if (!/^bytes=/.test(range)) {
        return res.status(400).send('Invalid range header specification.');
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
    log.debug('NFS - Ready to stream file for range' + start + "-" + end + "/" + total);
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
    let nfsReader = new NfsReader(req, res, filePath, rootPath, start, end,
      sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey);
    nfsReader.pipe(res);
  };
  log.debug('NFS - Invoking get file request');
  req.app.get('api').nfs.getFileMetadata(filePath, rootPath,
    sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, onFileMetadataRecieved);
};

export var getFileMetadata = function(req, res) {
  let responseHandler = new ResponseHandler(res);
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'rootPath\' mismatch');
  }
  let onFileMetadataRecieved = function(err, fileStats) {
    log.debug('NFS - File metatda for reading - ' + fileStats);
    if (err) {
      return res.status(400).send(err);
    }
    res.writeHead(200, {
      "Accept-Ranges": "bytes",
      "Created-On": new Date(fileStats.createdOn).toUTCString(),
      "Last-Modified": new Date(fileStats.modifiedOn).toUTCString(),
      "Metadata": fileStats.metadata,
      "Content-Type": mime.lookup(filePath) || 'application/octet-stream',
      "Content-Length": fileStats.size
    });
    res.end();
    };
    log.debug('NFS - Invoking get file metadata request');
    req.app.get('api').nfs.getFileMetadata(filePath, rootPath,
    sessionInfo.hasSafeDriveAccess(), sessionInfo.appDirKey, onFileMetadataRecieved);
};

export var modifyFileContent = function(req, res) {
  let sessionInfo = sessionManager.get(req.headers.sessionId);
  if (!sessionInfo) {
    return res.sendStatus(401);
  }
  let offset = 0;
  let responseHandler = new ResponseHandler(res);
  let filePath = req.params['0'];
  let rootPath = ROOT_PATH[req.params.rootPath.toLowerCase()];
  if (typeof rootPath === 'undefined') {
    return responseHandler.onResponse('Invalid request. \'rootPath\' mismatch');
  }
  if (req.get('range')) {
    var range = req.get('range').toLowerCase();
    if (!/^bytes=/.test(range)) {
      return res.status(400).send('Invalid range header specification.');
    }
    var positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
    offset = positions[0];
  }
  if (isNaN(offset)) {
    return responseHandler.onResponse('Invalid request. \'offset\' should be a number');
  }
  log.debug('NFS - Invoking modify file content request');
  var writer = new NfsWriter(req, filePath, offset, rootPath, sessionInfo, responseHandler);
  req.on('end', function() {
    writer.onClose();
  });
  writer.on('open', function() {
    req.pipe(writer);
  });
};

export var moveFile = function(req, res) {
  move(req, res, true);
}
