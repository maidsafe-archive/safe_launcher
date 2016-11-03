/* eslint-disable no-restricted-syntax */
import sessionManager from '../session_manager';
import { ResponseError, ResponseHandler, updateAppActivity, parseExpectionMsg } from '../utils';
import immutableData from '../../ffi/api/immutable_data';
import cipherOpts from '../../ffi/api/cipher_opts';
import { ImmutableDataWriter } from '../stream/immutable_data_writer';
import { ImmutableDataReader } from '../stream/immutable_data_reader';
import log from '../../logger/log';

const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';
let PLAIN_ENCRYPTION;

const getPlainEncryptionHandle = () => (
  new Promise(async(resolve, reject) => {
    if (PLAIN_ENCRYPTION === undefined) {
      try {
        PLAIN_ENCRYPTION = await cipherOpts.getCipherOptPlain();
      } catch (e) {
        reject(e);
      }
    }
    resolve(PLAIN_ENCRYPTION);
  })
);

export const getReaderHandle = async(req, res) => {
  log.debug(`Immutable data - ${req.id} :: Get reader handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Immutable data - ${req.id} :: Get reader handle 
      :: ${app ? 'Authorised' : 'Unauthorised'} request`);
    const readerHandle = await immutableData.getReaderHandle(app, req.params.handleId);
    log.debug(`Immutable data - ${req.id} :: Reader handle obtained`);
    const size = await immutableData.getReaderSize(readerHandle);
    log.debug(`Immutable data - ${req.id} :: Reader handle size obtained`);
    responseHandler(null, {
      handleId: readerHandle,
      size
    });
  } catch (e) {
    log.warn(`Immutable data - ${req.id} :: Get reader handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const getWriterHandle = async(req, res, next) => {
  log.debug(`Immutable data - ${req.id} :: Get writer handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Immutable data - ${req.id} :: Get writer handle :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Immutable data - ${req.id} :: Get writer handle :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const writerHandle = await immutableData.getWriterHandle(app);
    log.debug(`Immutable data - ${req.id} :: Writer handle obtained`);
    responseHandler(null, {
      handleId: writerHandle
    });
  } catch (e) {
    log.warn(`Immutable data - ${req.id} :: Get writer handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const write = async(req, res, next) => {
  log.debug(`Immutable data - ${req.id} :: Write Immutable data`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Immutable data - ${req.id} :: Write Immutable data :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Immutable data - ${req.id} :: Write Immutable data :: 
        Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    if (!req.headers['content-length'] || isNaN(req.headers['content-length'])) {
      return next(new ResponseError(400, 'Content-Length header is not present'));
    }
    const length = parseInt(req.headers['content-length'], 10);
    if (length === 0) {
      return responseHandler();
    }
    log.debug(`Immutable data - ${req.id} :: Initialised Immutable data writer stream`);
    const writer = new ImmutableDataWriter(req, req.params.handleId, responseHandler, length);
    req.on('aborted', () => {
      next(new ResponseError(400, 'Request aborted by client'));
    });
    req.pipe(writer);
  } catch (e) {
    log.warn(`Immutable data - ${req.id} :: Write Immutable data :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const read = async(req, res, next) => {
  log.debug(`Immutable data - ${req.id} :: Read Immutable data`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const handleId = req.params.handleId;
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Immutable data - ${req.id} :: Read Immutable data 
      :: ${app ? 'Authorised' : 'Unauthorised'} request`);
    const size = await immutableData.getReaderSize(handleId);
    log.debug(`Immutable data - ${req.id} :: Reader size obtained`);
    let range = req.get('range');
    let positions = [0];
    if (range) {
      range = range.toLowerCase();
      if (!/^bytes=/.test(range)) {
        return next(new ResponseError(400, 'invalid range specified'));
      }
      positions = range.toLowerCase().replace(/bytes=/g, '').split('-');
      for (const i in positions) {
        if (isNaN(positions[i])) {
          return next(new ResponseError(416));
        }
      }
    }
    const start = parseInt(positions[0], 10);
    const total = size;
    const end = (positions[1] && total) ? parseInt(positions[1], 10) : total;
    const chunkSize = end - start;
    if (chunkSize < 0 || end > total) {
      return next(new ResponseError(416));
    }
    log.debug(`ImmutableData - Ready to stream file for range ${start}-${end}/${total}`);
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'application/octet-stream'
    };
    res.writeHead(range ? 206 : 200, headers);
    if (chunkSize === 0) {
      updateAppActivity(req, res, true);
      return res.end();
    }
    log.debug(`Immutable data - ${req.id} :: Initialised Immutable data reader stream`);
    const reader = new ImmutableDataReader(req, res, handleId, start, end);
    reader.pipe(res);
  } catch (e) {
    log.warn(`Immutable data - ${req.id} :: Read Immutable data :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const closeWriter = async(req, res, next) => {
  log.debug(`Immutable data - ${req.id} :: Close writer`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Immutable data - ${req.id} :: Close writer :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Immutable data - ${req.id} :: Close writer :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    const cipherOptsHandle = isNaN(req.params.cipherOptsHandle) ?
      (await getPlainEncryptionHandle()) : req.params.cipherOptsHandle;
    const dataIdHandle = await immutableData.closeWriter(app,
      req.params.handleId, cipherOptsHandle);
    log.debug(`Immutable data - ${req.id} :: Writer closed`);
    responseHandler(null, {
      handleId: dataIdHandle
    });
  } catch (e) {
    log.warn(`Immutable data - ${req.id} :: Close writer :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const dropReader = async(req, res) => {
  log.debug(`Immutable data - ${req.id} :: Drop reader handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    const app = sessionInfo ? sessionInfo.app : null;
    log.debug(`Immutable data - ${req.id} :: 
      Drop reader handle :: ${app ? 'Authorised' : 'Unauthorised'} request`);
    await immutableData.dropReader(req.params.handleId);
    log.debug(`Immutable data - ${req.id} :: Reader handle dropped`);
    responseHandler();
  } catch (e) {
    log.warn(`Immutable data - ${req.id} :: Drop reader handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};

export const dropWriter = async(req, res, next) => {
  log.debug(`Immutable data - ${req.id} :: Drop writer handle`);
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      log.error(`Immutable data - ${req.id} :: Drop writer handle :: Unauthorised request`);
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    if (!app.permission.lowLevelApi) {
      log.error(`Immutable data - ${req.id} :: Drop writer handle :: Low level access not granted`);
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    await immutableData.dropWriterHandle(req.params.handleId);
    log.debug(`Immutable data - ${req.id} :: Writer handle dropped`);
    responseHandler();
  } catch (e) {
    log.warn(`Immutable data - ${req.id} :: Drop writer handle :: 
      Caught exception - ${parseExpectionMsg(e)}`);
    responseHandler(e);
  }
};
