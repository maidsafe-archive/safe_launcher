import ref from 'ref';

import FfiApi from '../ffi_api';
import misc from './misc';

import appManager from '../util/app_manager';
import {FILTER_TYPE} from '../model/enum';
const int32 = ref.types.int32;
const u8 = ref.types.uint8;
const u64 = ref.types.uint64;
const Void = ref.types.void;
const size_t = ref.types.size_t;
const bool = ref.types.bool;
const VoidPointer = ref.refType(Void);
const u8Pointer = ref.refType(u8);
const u64Pointer = ref.refType(u64);

class AppendableData extends FfiApi {

  constructor() {
    super();
  }

  getFunctionsToRegister() {
    return {
      'appendable_data_new_priv': [int32, [VoidPointer, u8Pointer, u64Pointer]],
      'appendable_data_new_pub': [int32, [VoidPointer, u8Pointer, u64Pointer]],
      'appendable_data_get': [int32, [VoidPointer, u64, u64Pointer]],
      'appendable_data_extract_data_id': [int32, [u64, u64Pointer]],
      'appendable_data_put': [int32, [VoidPointer, u64]],
      'appendable_data_post': [int32, [VoidPointer, u64, bool]],
      'appendable_data_encrypt_key': [int32, [u64, u64Pointer]],
      'appendable_data_num_of_data': [int32, [u64, u64Pointer]],
      'appendable_data_nth_data_id': [int32, [VoidPointer, u64, size_t, u64Pointer]],
      'appendable_data_append': [int32, [VoidPointer, u64, u64]],
      'appendable_data_remove_nth_data': [int32, [u64, size_t]],
      'appendable_data_toggle_filter': [int32, [u64]],
      'appendable_data_free': [int32, [u64]],
      'appendable_data_clear_deleted_data': [int32, [u64]],
      'appendable_data_insert_to_filter': [int32, [u64, u64]]
    };
  }

  _save(app, appendHandleId, isPost) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      if (isPost) {
        self.safeCore.appendable_data_post.async(appManager.getHandle(app), appendHandleId, false, onResult);
      } else {
        self.safeCore.appendable_data_put.async(appManager.getHandle(app), appendHandleId, onResult);
      }
    };
    return new Promise(executor);
  }

  _asDataId(appendHandleId) {
    const self = this;
    const executor = (resolve, reject) => {
      const dataHandleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(dataHandleRef.deref());
      };
      self.safeCore.appendable_data_extract_data_id.async(appendHandleId, dataHandleRef, onResult);
    };
    return new Promise(executor);
  }

  _asAppendableDataHandle(app, dataIdHandle) {
    const self = this;
    const executor = (resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      self.safeCore.appendable_data_get.async(appManager.getHandle(app), dataIdHandle, handleRef, onResult);
    };
    return new Promise(executor);
  }

  _toggleFilter(appendDataHandle) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      self.safeCore.appendable_data_toggle_filter.async(appendDataHandle, onResult);
    };
    return new Promise(executor);
  }

  _insertToFilter(appendDataHandle, signKeyHandle) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      self.safeCore.appendable_data_insert_to_filter.async(appendDataHandle, signKeyHandle, onResult);
    };
    return new Promise(executor);
  }

  create(app, id, isPrivate = true, filterType, filterKeys = []) {
    const self = this;
    const executor = (resolve, reject) => {
      if (!app) {
        return reject('App parameter is mandatory');
      }
      const handleRef = ref.alloc(u64);
      const onResult = async (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        try {
          const appendDataHandle = handleRef.deref();
          if (filterType === FILTER_TYPE.WHITE_LIST) {
            await self._toggleFilter(appendDataHandle);
          }
          let key;
          for (key of filterKeys) {
            await self._insertToFilter(appendDataHandle, key);
          }
          await self._save(app, appendDataHandle, false);
          const dataHandleId = await self._asDataId(appendDataHandle);
          self.safeCore.appendable_data_free.async(appendDataHandle, (e) => {});
          resolve(dataHandleId);
        } catch(e) {
          reject(e);
        }
      };
      if (isPrivate) {
        self.safeCore.appendable_data_new_priv.async(appManager.getHandle(app), id, handleRef, onResult);
      } else {
        self.safeCore.appendable_data_new_pub.async(appManager.getHandle(app), id, handleRef, onResult);
      }
    };
    return new Promise(executor);
  }

  getEncryptKey(app, dataIdHandle) {
    const self = this;
    const executor = async (resolve, reject) => {
      const keyHandleRef = ref.alloc(u64);
      try {
        const appendableDataHandle = await self._asAppendableDataHandle(app, dataIdHandle);
        const onResult = (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          self.safeCore.appendable_data_free.async(appendableDataHandle, (e) => {});
          resolve(keyHandleRef.deref());
        };
        self.safeCore.appendable_data_encrypt_key.async(appendableDataHandle, keyHandleRef, onResult);
      } catch(e) {
        reject(e);
      }
    };
    return new Promise(executor);
  }

  append(app, appendableDataIdHandle, dataIdHandle) {
    const self = this;
    const executor = async (resolve, reject) => {
      try {
        const appendableDataHandle = await self._asAppendableDataHandle(app, appendableDataIdHandle);
        const onResult = (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          self.safeCore.appendable_data_free.async(appendableDataHandle, (e) => {});
          resolve();
        };
        self.safeCore.appendable_data_append.async(appManager.getHandle(app),
          appendableDataHandle, dataIdHandle, onResult);
      } catch(e) {
        reject(e);
      }
    };
    return new Promise(executor);
  }

  getLength(app, dataIdHandle) {
    const self = this;
    const executor = async (resolve, reject) => {
      try {
        const appendableDataHandle = await self._asAppendableDataHandle(app, dataIdHandle);
        const lengthRef = ref.alloc(u64);
        const onResult = (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          self.safeCore.appendable_data_free.async(appendableDataHandle, (e) => {});
          resolve(lengthRef.deref());
        };
        self.safeCore.appendable_data_num_of_data.async(appendableDataHandle, lengthRef, onResult);
      } catch(e) {
        reject(e);
      }
    };
    return new Promise(executor);
  }

  getDataIdFrom(app, dataIdHandle, index) {
    const self = this;
    const executor = async (resolve, reject) => {
      try {
        const appendableDataHandle = await self._asAppendableDataHandle(app, dataIdHandle);
        const dataIdRef = ref.alloc(u64);
        const onResult = (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          self.safeCore.appendable_data_free.async(appendableDataHandle, (e) => {});
          resolve(dataIdRef.deref());
        };
        self.safeCore.appendable_data_nth_data_id.async(appManager.getHandle(app),
          appendableDataHandle, index, dataIdRef, onResult);
      } catch (e) {
        reject(e);
      }
    };
    return new Promise(executor);
  }

  removeFrom(app, dataIdHandle, index) {
    const self = this;
    const executor = async (resolve, reject) => {
      try {
        const appendableDataHandle = await self._asAppendableDataHandle(app, dataIdHandle);
        const onResult = async (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          await self._save(app, appendableDataHandle, true);
          self.safeCore.appendable_data_free.async(appendableDataHandle, (e) => {});
          resolve();
        };
        self.safeCore.appendable_data_remove_nth_data.async(appendableDataHandle, index, onResult);
      } catch(e) {
        reject(e);
      }
    };
    return new Promise(executor);
  }

  clearAllDeletedData(app, handleId) {
    return new Promise(async (resolve, reject) => {
      try {
        const appendableDataHandle = await this._asAppendableDataHandle(app, handleId);
        const onResult = async (err, res) => {
          if (err || res != 0) {
            reject(err);
          }
          await this._save(app, appendableDataHandle, true);
          this.safeCore.appendable_data_free.async(appendableDataHandle, (e) => {});
          resolve();
        };
        this.safeCore.appendable_data_clear_deleted_data.async(appendableDataHandle, onResult);
      } catch(e) {
        reject(e);
      }
    });
  }

  serialise = (app, handleId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const appendableDataHandle = await this._asAppendableDataHandle(app, handleId);
        const serialisedData = await misc.serialiseAppendableData(appendableDataHandle);
        this.safeCore.appendable_data_free.async(appendableDataHandle, (e) => {});
        resolve(serialisedData);
      } catch(e) {
        reject(e);
      }
    });
  };

}

const appendableData = new AppendableData();
export default appendableData;
