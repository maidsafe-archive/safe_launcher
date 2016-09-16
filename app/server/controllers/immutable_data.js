import sessionManager from '../session_manager';
import {ResponseError, ResponseHandler, updateAppActivity} from '../utils';
import immutableData from '../../ffi/api/immutable_data';
import dataId from '../../ffi/api/data_id';
import { ENCRYPTION_TYPE } from '../../ffi/model/enum';
import {ImmutableDataWriter} from '../stream/immutable_data_writer';
import {ImmutableDataReader} from '../stream/immutable_data_reader';
const API_ACCESS_NOT_GRANTED = 'Low level api access is not granted';
const UNAUTHORISED_ACCESS = 'Unauthorised access';
const HANDLE_ID_KEY = 'Handle-Id';

// post
export const write = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    if (!sessionInfo) {
      return next(new ResponseError(401, UNAUTHORISED_ACCESS));
    }
    const app = sessionInfo.app;
    let publicKeyHandle;
    if (!app.permission.lowLevelApi) {
      return next(new ResponseError(403, API_ACCESS_NOT_GRANTED));
    }
    if (!req.headers['content-length'] || isNaN(req.headers['content-length'])) {
      return next(new ResponseError(400, 'Content-Length header is not present'));
    }
    let encryptionType = ENCRYPTION_TYPE.PLAIN;
    if (req.headers.encryption) {
      encryptionType = ENCRYPTION_TYPE[req.headers.encryption.toUpperCase()] || ENCRYPTION_TYPE.PLAIN;
    }
    if (encryptionType === ENCRYPTION_TYPE.ASYMMETRIC) {
      if (!req.headers['encrypt-key-handle']) {
        return next(new ResponseError(400, 'Encrypt key handle is not present in the header'));
      }
      if (isNaN(req.headers['encrypt-key-handle'])) {
        return next(new ResponseError(400, 'Encrypt key handle is not a valid number'));
      }
      publicKeyHandle = req.headers['encrypt-key-handle'];
    }
    const length = parseInt(req.headers['content-length']);
    const writerHandle = await immutableData.getWriterHandle(app);
    const writer = new ImmutableDataWriter(req, res, app, writerHandle, encryptionType,
      publicKeyHandle, responseHandler, length);
    req.on('aborted', function() {
      next(new ResponseError(400, 'Request aborted by client'));
    });
    req.pipe(writer);
  } catch(e) {
    responseHandler(e);
  }
};

// GET /handleId
export const read = async (req, res, next) => {
  const responseHandler = new ResponseHandler(req, res);
  try {
    if (!req.params.handleId) {
      return next(new ResponseError(400, '\'handleId\' parameter is missing'));
    }
    const handleId = req.params.handleId;
    const sessionInfo = sessionManager.get(req.headers.sessionId);
    let app = sessionInfo ? sessionInfo.app : null;    
    const readerId = await immutableData.getReaderHandle(app, handleId);
    const size = await immutableData.getReaderSize(readerId);
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
    let chunksize = end - start;
    if (chunksize < 0 || end > total) {
      return next(new ResponseError(416));
    }
    // log.debug('ImmutableData - Ready to stream file for range' + start + '-' + end + '/' + total);
    var headers = {
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/octet-stream'
    };
    res.writeHead(range ? 206 : 200, headers);
    if (chunksize === 0) {
      updateAppActivity(req, res, true);
      return res.end();
    }
    const reader = new ImmutableDataReader(req, res, readerId, start, end);
    reader.pipe(res);
  } catch(e) {
    responseHandler(e);
  }
};
