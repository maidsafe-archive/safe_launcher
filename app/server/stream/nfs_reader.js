import { log } from './../../logger/log';
import nfs from '../../ffi/api/nfs';
import { updateAppActivity } from './../utils.js';
var Readable = require('stream').Readable;

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

  _read = async (next) => {
    try {
      if (this.curOffset === this.end) {
        this.push(null);
        return updateAppActivity(this.req, this.res, true);
      }
      const diff = this.end - this.curOffset;
      const eventEmitter = this.req.app.get('eventEmitter');
      const eventType = this.req.app.get('EVENT_TYPE').DATA_DOWNLOADED;
      this.sizeToRead = diff > this.MAX_SIZE_TO_READ ? this.MAX_SIZE_TO_READ : diff;
      let data = await nfs.readFile(this.app, this.filePath, this.isPathShared,
        this.curOffset, this.sizeToRead);
      this.curOffset += this.sizeToRead;
      data = new Buffer(data.toString(), 'base64');
      this.push(data);
      eventEmitter.emit(eventType, data.length);
    } catch(e) {
      console.error(e);
      this.push(null);
      log.error(e);
      updateAppActivity(this.req, this.res);
      this.res.sendStatus(400);
    }
  }
}
