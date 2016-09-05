import { log } from './../../logger/log';

export default class ClientStats {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'client-stats';
  }

  fetchGetsCount(callback) {
    log.debug('Invoking CLIENT STATS API:: GETs COUNT::' + this.MODULE);
    this.send({
      module: this.MODULE,
      action: 'gets'
    }, callback);
  }

  fetchDeletesCount(callback) {
    log.debug('Invoking CLIENT STATS API:: DELETEs COUNT::' + this.MODULE);
    this.send({
      module: this.MODULE,
      action: 'deletes'
    }, callback);
  }

  fetchPostsCount(callback) {
    log.debug('Invoking CLIENT STATS API:: POSTs COUNT::' + this.MODULE);
    this.send({
      module: this.MODULE,
      action: 'posts'
    }, callback);
  }

  fetchPutsCount(callback) {
    log.debug('Invoking CLIENT STATS API:: PUTs COUNT::' + this.MODULE);
    this.send({
      module: this.MODULE,
      action: 'puts'
    }, callback);
  }

  getAccountInfo(callback) {
    log.debug('Invoking CLIENT STATS API:: Account Info ::' + this.MODULE);
    this.send({
      module: this.MODULE,
      action: 'acc-info'
    }, callback);
  }
}
