'use strict';

import FfiApi from '../ffi_api';
import ffi from 'ffi';
import ref from 'ref';
import appManager from './app_manager';
import { log } from '../../logger/log';

const Void = ref.types.void;
const int32 = ref.types.int32;
const int64 = ref.types.int64;
const u64 = ref.types.uint64;
const u64Pointer = ref.refType(u64);
const SessionHandle = ref.refType(ref.types.void);

class SessionManager extends FfiApi {
  constructor() {
    super();
    this.handle = null;
    this.stateChangeListener = null;
  }

  onNetworkStateChange(callback) {
    this.stateChangeListener = callback;
  }

  getFunctionsToRegister() {
    return {
      'client_issued_deletes': [int64, [SessionHandle]],
      'client_issued_gets': [int64, [SessionHandle]],
      'client_issued_posts': [int64, [SessionHandle]],
      'client_issued_puts': [int64, [SessionHandle]],
      'drop_session': [Void, [SessionHandle]],
      'get_account_info': [int32, [SessionHandle, u64Pointer, u64Pointer]],
      'register_network_event_observer': [int32, [SessionHandle, 'pointer']]
    };
  }

  get sessionHandle() {
    if (!this.handle) {
      throw new Error('Session handle not found');
    }
    return this.handle;
  }

  getAccountInfo() {
    log.debug('FFI :: Get account info');
    return new Promise((resolve, reject) => {
      const used = ref.alloc(u64);
      const total = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Get account info :: ${err || res}`);
          return reject(err || res);
        }
        resolve({
          used: used.deref(),
          available: total.deref()
        });
      };
      this.safeCore.get_account_info.async(this.handle, used, total, onResult);
    });
  }

  getClientGetsCount() {
    log.debug('FFI :: Get client stats - Gets count');
    return new Promise((resolve, reject) => {
      const onResult = (err, count) => {
        if (err) {
          log.error(`FFI :: Get client stats - Gets count :: ${err}`);
          return reject(err);
        }
        resolve(count);
      };
      this.safeCore.client_issued_gets.async(this.handle, onResult);
    });
  }

  getClientDeletesCount() {
    log.debug('FFI :: Get client stats - Deleted count');
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, count) => {
        if (err) {
          log.error(`FFI :: Get client stats - Deleted count :: ${err}`);
          return reject(err);
        }
        resolve(count);
      };
      self.safeCore.client_issued_deletes.async(self.handle, onResult);
    };
    return new Promise(executor);
  }

  getClientPutsCount() {
    log.debug('FFI :: Get client stats - Puts count');
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, count) => {
        if (err) {
          log.error(`FFI :: Get client stats - Puts count error :: ${err}`);
          return reject(err);
        }
        resolve(count);
      };
      self.safeCore.client_issued_puts.async(self.handle, onResult);
    };
    return new Promise(executor);
  }

  getClientPostsCount() {
    log.debug('FFI :: Get client stats - Posts count');
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, count) => {
        if (err) {
          log.error(`FFI :: Get client stats - Posts count :: ${err}`);
          return reject(err);
        }
        resolve(count);
      };
      self.safeCore.client_issued_posts.async(self.handle, onResult);
    };
    return new Promise(executor);
  }

  sendNetworkDisconnected() {
    if (self.stateChangeListener) {
      self.stateChangeListener(2);
    }
  };

  set sessionHandle(handle) {
    log.debug('FFI :: Set session handle');
    (async() => {
      if (this.handle) {
        await appManager.revokeAnonymousApp();
        await this.dropSessionHandle();
      }
      const onStateChange = ffi.Callback(Void, [int32], (state) => {
        if (this.stateChangeListener) {
          this.stateChangeListener(state);
        }
      });
      if (this.safeCore.register_network_event_observer(handle, onStateChange) !== 0) {
        throw new Error('Failed to set network observer');
      }
      this.handle = handle;
      await appManager.createUnregisteredApp();
      if (this.stateChangeListener) {
        this.stateChangeListener(0);
      }
    })();
  }

  dropSessionHandle() {
    log.debug('FFI :: Drop session handle');
    const self = this;
    const executor = (resolve, reject) => {
      self.safeCore.drop_session.async(self.handle, (err) => {
        if (err) {
          log.error(`FFI :: Drop session handle :: ${err}`);
          return reject(err);
        }
        resolve();
      });
    };
    return new Promise(executor);
  }

}

const sessionManager = new SessionManager();
export default sessionManager;
