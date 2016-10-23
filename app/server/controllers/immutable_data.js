'use strict';

import sessionManager from '../session_manager';
import {ResponseError, ResponseHandler, updateAppActivity} from '../utils';
import immutableData from '../../ffi/api/immutable_data';
import cipherOpts from '../../ffi/api/cipher_opts';
import {ImmutableDataWriter} from '../stream/immutable_data_writer';
import {ImmutableDataReader} from '../stream/immutable_data_reader';
const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';
let PLAIN_ENCRYPTION;

const getPlainEncryptionHandle = () => {
  return new Promise(async (resolve, reject) => {
    if (PLAIN_ENCRYPTION === undefined) {
      try {
        PLAIN_ENCRYPTION = await cipherOpts.getCipherOptPlain();
      } catch(e) {
        reject(e);
      }
    }
    resolve(PLAIN_ENCRYPTION);
  });
};

export const getReaderHandle = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    const readerHandle = await immutableData.getReaderHandle(app, req.params.handleId);
    const size = await immutableData.getReaderSize(readerHandle);
    responseHandler(null, {
      handleId: readerHandle,
      size: size
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const getWriterHandle = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const writerHandle = await immutableData.getWriterHandle(app);
    responseHandler(null, {
      handleId: writerHandle
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const write = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    if (!req.headers['content-length'] || isNaN(req.headers['content-length'])) {
      return next(new ResponseError(400, 'Content-Length header is not present'));
    }
    const length = parseInt(req.headers['content-length']);
    if (length === 0) {
      return responseHandler();
    }
    const writer = new ImmutableDataWriter(req, req.params.handleId, responseHandler, length);
    req.on('aborted', () => {
      next(new ResponseError(400, 'Request aborted by client'));
    });
    req.pipe(writer);
  } catch(e) {
    responseHandler(e);
  }
};

export const read = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const handleId = req.params.handleId;
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    let app = sessionInfo ? sessionInfo.app : null;
    const size = await immutableData.getReaderSize(handleId);
    let range = req.get('range');
    let positions = [ 0 ];
    if (range) {
      range = range.toLowerCase();
      if (!/^bytes=/.test(range)) {
        return next(new ResponseError(400, 'invalid range specified'));
      }
      positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
      for (var i in positions) {
        if (isNaN(positions[i])) {
          return next(new ResponseError(416));
        }
      }
    }
    let start = parseInt(positions[0]);
    let total = size;
    let end = (positions[1] && total) ? parseInt(positions[1]) : total;
    let chunkSize = end - start;
    if (chunkSize < 0 || end > total) {
      return next(new ResponseError(416));
    }
    // log.debug('ImmutableData - Ready to stream file for range' + start + '-' + end + '/' + total);
    var headers = {
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'application/octet-stream'
    };
    res.writeHead(range ? 206 : 200, headers);
    if (chunkSize === 0) {
      updateAppActivity(req, res, true);
      return res.end();
    }
    const reader = new ImmutableDataReader(req, res, handleId, start, end);
    reader.pipe(res);
  } catch(e) {
    responseHandler(e);
  }
};

export const closeWriter = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    let cipherOptsHandle = isNaN(req.params.cipherOptsHandle) ? (await getPlainEncryptionHandle()) :
      req.params.cipherOptsHandle;
    const dataIdHandle = await immutableData.closeWriter(app, req.params.handleId, cipherOptsHandle);
    responseHandler(null, {
      handleId: dataIdHandle
    });
  } catch(e) {
    responseHandler(e);
  }
};

export const dropReader = async (req, res) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    await immutableData.dropReader(req.params.handleId);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};

export const dropWriter = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await immutableData.dropWriterHandle(req.params.handleId);
    responseHandler();
  } catch(e) {
    responseHandler(e);
  }
};
