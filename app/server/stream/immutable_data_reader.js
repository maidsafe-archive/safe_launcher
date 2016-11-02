/* eslint-disable import/prefer-default-export */
/* eslint-disable func-names */
import { Readable } from 'stream';
import util from 'util';
import log from './../../logger/log';
import immutableData from '../../ffi/api/immutable_data';
import { ResponseHandler } from './../utils.js';

export const ImmutableDataReader = function (req, res, readerId, start, end) {
  Readable.call(this);
  this.eventEmitter = req.app.get('eventEmitter');
  this.eventType = req.app.get('EVENT_TYPE').DATA_DOWNLOADED;
  this.responseHandler = new ResponseHandler(req, res);
  this.res = res;
  this.readerId = readerId;
  this.end = end;
  this.curOffset = start;
  this.sizeToRead = 0;
  return this;
};

util.inherits(ImmutableDataReader, Readable);

/* eslint-disable no-underscore-dangle */
ImmutableDataReader.prototype._read = function () {
  if (this.curOffset === this.end) {
    this.responseHandler();
    return this.push(null);
  }
  const MAX_SIZE_TO_READ = 1048576; // 1 MB
  const diff = this.end - this.curOffset;

  this.sizeToRead = diff > MAX_SIZE_TO_READ ? MAX_SIZE_TO_READ : diff;
  immutableData.read(this.readerId, this.curOffset, this.sizeToRead).then((data) => {
    this.curOffset += this.sizeToRead;
    this.push(data);
    this.eventEmitter.emit(this.eventType, data.length);
  }, (err) => {
    this.push(null);
    // log.error(err);
    this.responseHandler(err);
  }, (e) => {
    log.error(`Stream :: Immutable data reader :: ${e}`);
  });
};
/* eslint-enable no-underscore-dangle */
