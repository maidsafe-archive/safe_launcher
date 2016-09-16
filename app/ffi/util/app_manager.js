'use strict';

import ref from 'ref';
import FfiApi from '../ffi_api';
import App from '../model/app';
import sessionManager from '../util/session_manager';

const Void = ref.types.void;
const int32 = ref.types.int32;
const CString = ref.types.CString;
const u64 = ref.types.uint64;
const bool = ref.types.bool;

const AppHandle = ref.refType(ref.types.void);
const SessionHandle = ref.refType(ref.types.void);
const AppHandlePointer = ref.refType(ref.refType(ref.types.void));

class AppManager extends FfiApi {
  constructor() {
    super();
    this.anonymousApp = null;
    this.holder = new Map();
  }

  getFunctionsToRegister() {
    return {
      'register_app': [int32, [SessionHandle, CString, u64, CString, u64, CString, u64, bool, AppHandlePointer]],
      'create_unauthorised_app': [int32, [SessionHandle, AppHandlePointer]],
      'drop_app': [Void, [AppHandle]]
    };
  }

  getHandle(app) {
    if (!app || !this.holder.has(app)) {
      return this.anonymousApp;
    }
    return this.holder.get(app);
  }

  registerApp(app) {
    const self = this;
    const appHandle = ref.alloc(AppHandlePointer);
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        const handle = appHandle.deref();
        self.holder.set(app, handle);
        resolve(app);
      };
      self.safeCore.register_app.async(sessionManager.sessionHandle,
        app.name, app.name.length, app.id, app.id.length, app.vendor,
        app.vendor.length, app.permission.safeDrive, appHandle, onResult);
    };
    return new Promise(executor);
  }

  revokeApp(app) {
    const self = this;
    if (!self.holder.has(app)) {
      return new Promise((resolve, reject) => {
        reject('Application not found');
      });
    }
    const executor = (resolve, reject) => {
      const onResult = (err) => {
        if (err) {
          return reject(err);
        }
        self.holder.delete(app);
        resolve();
      };
      self.safeCore.drop_app.async(self.holder.get(app), onResult);
    };
    return new Promise(executor);
  }

  revokeAnonymousApp() {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err) => {
        if (err) {
          return reject(err);
        }
        self.anonymousApp = null;
        resolve();
      };
      self.safeCore.drop_app.async(self.anonymousApp, onResult);
    };
    return new Promise(executor);
  }

  createUnregisteredApp() {
    const self = this;

    const executor = (resolve, reject) => {
      const app = new App('Anonymous Application', 'Anonymous', '0.0.0', 'Anonymous', []);
      const appHandle = ref.alloc(AppHandlePointer);
      const onResult = async (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        try {
          const handle = appHandle.deref();          
          self.anonymousApp = handle;
          resolve(app);
        } catch(e) {
          console.error(e);
        }
      };

      self.safeCore.create_unauthorised_app.async(sessionManager.sessionHandle, appHandle, onResult);
    };
    return new Promise(executor);
  }

  drop() {
    const self = this;
    const exec = async (resolve, reject) => {
      try {
        for (let app of self.holder.keys()) {
          await self.revokeApp(app);
        }
        resolve();
      } catch(e) {
        console.error(e);
        reject(e);
      }
    }
    return new Promise(exec);
  }
}

const appManager = new AppManager();
export default appManager;
