import ref from 'ref';
import FfiApi from '../ffi_api';
import sessionManager from '../util/session_manager';
import log from '../../logger/log';

const int32 = ref.types.int32;
const SessionHandlePointer = ref.refType(ref.refType(ref.types.void));
const CString = ref.types.CString;
const u64 = ref.types.uint64;

class Auth extends FfiApi {
  getFunctionsToRegister() {
    return {
      create_unregistered_client: [int32, [SessionHandlePointer]],
      create_account: [int32, [CString, u64, CString, u64, SessionHandlePointer]],
      log_in: [int32, [CString, u64, CString, u64, SessionHandlePointer]]
    };
  }

  getUnregisteredSession() {
    const self = this;
    const executor = (resolve, reject) => {
      const sessionHandle = ref.alloc(SessionHandlePointer);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          sessionManager.sendNetworkDisconnected();
          log.error(`FFI :: Auth :: Get unregistered session :: ${err || res}`);
          return reject(err || res);
        }
        sessionManager.sessionHandle = sessionHandle.deref();
        resolve();
      };
      self.safeCore.create_unregistered_client.async(sessionHandle, onResult);
    };
    return new Promise(executor);
  }

  register(locator, password) {
    const self = this;
    const executor = (resolve, reject) => {
      const sessionHandle = ref.alloc(SessionHandlePointer);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Auth :: Register :: ${err || res}`);
          return reject(err || res);
        }
        sessionManager.sessionHandle = sessionHandle.deref();
        resolve();
      };
      self.safeCore.create_account.async(locator, locator.length,
        password, password.length, sessionHandle, onResult);
    };
    return new Promise(executor);
  }

  login(locator, password) {
    const self = this;
    const executor = (resolve, reject) => {
      const sessionHandle = ref.alloc(SessionHandlePointer);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Auth :: Login :: ${err || res}`);
          return reject(err || res);
        }
        try {
          sessionManager.sessionHandle = sessionHandle.deref();
        } catch (e) {
          return reject(e);
        }
        resolve();
      };
      self.safeCore.log_in.async(locator, locator.length,
        password, password.length, sessionHandle, onResult);
    };
    return new Promise(executor);
  }
}

const auth = new Auth();
export default auth;
