import { Readable } from 'stream';
import log from './../../logger/log';
import nfs from '../../ffi/api/nfs';
import { updateAppActivity, parseExpectionMsg } from './../utils.js';

/* eslint-disable no-underscore-dangle */
export default class NfsReader extends Readable {
  constructor(req, res, filePath, isPathShared, start, end, app) {
    super();
    this.req = req;
    this.res = res;
    this.filePath = filePath;
    this.isPathShared = isPathShared;
    this.start = start;
    this.end = end;
    this.curOffset = start;
    this.sizeToRead = 0;
    this.app = app;
    this.MAX_SIZE_TO_READ = 1048576; // 1 MB
  }

  _read = async() => {
    try {
      if (this.curOffset === this.end) {
        this.push(null);
        return updateAppActivity(this.req, this.res, true);
      }
      const diff = this.end - this.curOffset;
      const eventEmitter = this.req.app.get('eventEmitter');
      const eventType = this.req.app.get('EVENT_TYPE').DATA_DOWNLOADED;
      this.sizeToRead = diff > this.MAX_SIZE_TO_READ ? this.MAX_SIZE_TO_READ : diff;
      const data = await nfs.readFile(this.app, this.filePath, this.isPathShared,
        this.curOffset, this.sizeToRead);
      this.curOffset += this.sizeToRead;
      this.push(data);
      eventEmitter.emit(eventType, data.length);
    } catch (e) {
      log.warn(`Stream :: NFS reader :: ${parseExpectionMsg(e)}`);
      this.push(null);
      updateAppActivity(this.req, this.res);
      this.res.sendStatus(400);
    }
  }
}
/* eslint-enable no-underscore-dangle */
