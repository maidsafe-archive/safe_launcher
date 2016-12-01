import ref from 'ref';
import Enum from 'enum';

import FfiApi from '../ffi_api';
import misc from './misc';
import appManager from '../util/app_manager';
import { FILTER_TYPE } from '../model/enum';
import log from '../../logger/log';

const int32 = ref.types.int32;
const Int = ref.types.int;
const u8 = ref.types.uint8;
const u64 = ref.types.uint64;
const Void = ref.types.void;
/* eslint-disable camelcase */
const size_t = ref.types.size_t;
/* eslint-enable camelcase */
const bool = ref.types.bool;
const AppHandle = ref.refType(Void);
const u8Pointer = ref.refType(u8);
const u64Pointer = ref.refType(u64);
const boolPointer = ref.refType(bool);
/* eslint-disable camelcase */
const size_tPointer = ref.refType(size_t);

const Ffi_FilterType = new Enum({ BlackList: 0, WhiteList: 1 });
/* eslint-enable camelcase */

class AppendableData extends FfiApi {
  getFunctionsToRegister() {
    /* eslint-disable camelcase */
    return {
      appendable_data_new_priv: [int32, [AppHandle, u8Pointer, u64Pointer]],
      appendable_data_new_pub: [int32, [AppHandle, u8Pointer, u64Pointer]],
      appendable_data_get: [int32, [AppHandle, u64, u64Pointer]],
      appendable_data_extract_data_id: [int32, [u64, u64Pointer]],
      appendable_data_put: [int32, [AppHandle, u64]],
      appendable_data_validate_size: [int32, [u64, boolPointer]],
      appendable_data_post: [int32, [AppHandle, u64, bool]],
      appendable_data_encrypt_key: [int32, [u64, u64Pointer]],
      appendable_data_num_of_data: [int32, [u64, size_tPointer]],
      appendable_data_nth_data_id: [int32, [AppHandle, u64, size_t, u64Pointer]],
      appendable_data_append: [int32, [AppHandle, u64, u64]],
      appendable_data_remove_nth_data: [int32, [u64, size_t]],
      appendable_data_toggle_filter: [int32, [u64]],
      appendable_data_free: [int32, [u64]],
      appendable_data_insert_to_filter: [int32, [u64, u64]],
      appendable_data_is_owned: [int32, [AppHandle, u64, boolPointer]],
      appendable_data_version: [int32, [u64, u64Pointer]],
      appendable_data_num_of_deleted_data: [int32, [u64, size_tPointer]],
      appendable_data_nth_deleted_data_id: [int32, [AppHandle, u64, size_t, u64Pointer]],
      appendable_data_nth_data_sign_key: [int32, [AppHandle, u64, size_t, u64Pointer]],
      appendable_data_nth_deleted_data_sign_key: [int32, [AppHandle, u64, size_t, u64Pointer]],
      appendable_data_restore_nth_deleted_data: [int32, [u64, size_t]],
      appendable_data_clear_data: [int32, [u64]],
      appendable_data_clear_deleted_data: [int32, [u64]],
      appendable_data_remove_nth_deleted_data: [int32, [u64, size_t]],
      appendable_data_remove_from_filter: [int32, [u64, u64]],
      appendable_data_filter_type: [int32, [u64, ref.refType(Int)]],
      appendable_data_num_of_filter_keys: [int32, [u64, size_tPointer]],
      appendable_data_nth_filter_key: [int32, [u64, size_t, u64Pointer]]
      // 'appendable_data_delete': [int32, [AppHandle, u64]]
    };
    /* eslint-enable camelcase */
  }

  save(app, appendHandleId, isPost) {
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Save :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      if (isPost) {
        this.safeCore.appendable_data_post.async(appManager.getHandle(app),
          appendHandleId, false, onResult);
      } else {
        this.safeCore.appendable_data_put.async(appManager.getHandle(app),
          appendHandleId, onResult);
      }
    });
  }

  isSizeValid(appendHandleId) {
    return new Promise((resolve, reject) => {
      const isValidRef = ref.alloc(bool);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Check size valid :: ${err || res}`);
          return reject(err || res);
        }
        resolve(isValidRef.deref());
      };
      this.safeCore.appendable_data_validate_size.async(appendHandleId, isValidRef, onResult);
    });
  }

  asDataId(appendHandleId) {
    return new Promise((resolve, reject) => {
      const dataHandleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get Data Id handle :: ${err || res}`);
          return reject(err || res);
        }
        resolve(dataHandleRef.deref());
      };
      this.safeCore.appendable_data_extract_data_id.async(appendHandleId, dataHandleRef, onResult);
    });
  }

  getDataId(app, handleId, index, fromDeleted) {
    return new Promise((resolve, reject) => {
      const dataHandleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get data at index :: ${err || res}`);
          return reject(err || res);
        }
        resolve(dataHandleRef.deref());
      };
      if (fromDeleted) {
        this.safeCore.appendable_data_nth_deleted_data_id.async(appManager.getHandle(app),
          handleId, index, dataHandleRef, onResult);
      } else {
        this.safeCore.appendable_data_nth_data_id.async(appManager.getHandle(app),
          handleId, index, dataHandleRef, onResult);
      }
    });
  }

  getAppendableDataHandle(app, dataIdHandle) {
    return new Promise((resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get handle :: ${err || res}`);
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      this.safeCore.appendable_data_get.async(appManager.getHandle(app),
        dataIdHandle, handleRef, onResult);
    });
  }

  toggleFilter(appendDataHandle) {
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Toggle filter :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      this.safeCore.appendable_data_toggle_filter.async(appendDataHandle, onResult);
    });
  }

  insertToFilter(appendDataHandle, signKeyHandle) {
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Add to filter :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      this.safeCore.appendable_data_insert_to_filter.async(appendDataHandle,
        signKeyHandle, onResult);
    });
  }

  removeFromFilter(appendDataHandle, signKeyHandle) {
    log.debug('FFI :: Appendable data :: Remove from filter');
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Remove from filter :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      this.safeCore.appendable_data_remove_from_filter.async(appendDataHandle,
        signKeyHandle, onResult);
    });
  }

  getFilterType(handleId) {
    return new Promise((resolve, reject) => {
      const filterTypeRef = ref.alloc(Ffi_FilterType);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get filter type :: ${err || res}`);
          return reject(err || res);
        }
        resolve(Ffi_FilterType.get(filterTypeRef.deref().key));
      };
      this.safeCore.appendable_data_filter_type.async(handleId, filterTypeRef, onResult);
    });
  }

  getFilterLength(handleId) {
    return new Promise((resolve, reject) => {
      const lengthRef = ref.alloc(size_t);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get filter length :: ${err || res}`);
          return reject(err || res);
        }
        resolve(lengthRef.deref());
      };
      this.safeCore.appendable_data_num_of_filter_keys.async(handleId, lengthRef, onResult);
    });
  }

  getSignKeyFromFilter(handleId, index) {
    return new Promise((resolve, reject) => {
      const signKeyHandleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get sign key from filter :: ${err || res}`);
          return reject(err || res);
        }
        resolve(signKeyHandleRef.deref());
      };
      this.safeCore.appendable_data_nth_filter_key.async(handleId,
        index, signKeyHandleRef, onResult);
    });
  }

  create(app, id, isPrivate = true, filterType, filterKeys = []) {
    return new Promise((resolve, reject) => {
      if (!app) {
        return reject('App parameter is mandatory');
      }
      const handleRef = ref.alloc(u64);
      const onResult = async(err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Create :: ${err || res}`);
          return reject(err || res);
        }
        try {
          const appendDataHandle = handleRef.deref();
          if (filterType === FILTER_TYPE.WHITE_LIST) {
            await this.toggleFilter(appendDataHandle);
          }
          let key;
          for (key of filterKeys) {
            await this.insertToFilter(appendDataHandle, key);
          }
          resolve(appendDataHandle);
        } catch (e) {
          reject(e);
        }
      };
      if (isPrivate) {
        this.safeCore.appendable_data_new_priv.async(appManager.getHandle(app),
          id, handleRef, onResult);
      } else {
        this.safeCore.appendable_data_new_pub.async(appManager.getHandle(app),
          id, handleRef, onResult);
      }
    });
  }

  getEncryptKey(handleId) {
    return new Promise((resolve, reject) => {
      const keyHandleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get encrypt key :: ${err || res}`);
          return reject(err || res);
        }
        resolve(keyHandleRef.deref());
      };
      this.safeCore.appendable_data_encrypt_key.async(handleId, keyHandleRef, onResult);
    });
  }

  getSigningKey(app, handleId, index, fromDeleted) {
    return new Promise((resolve, reject) => {
      const keyHandleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get sign key :: ${err || res}`);
          return reject(err || res);
        }
        resolve(keyHandleRef.deref());
      };
      if (fromDeleted) {
        this.safeCore.appendable_data_nth_deleted_data_sign_key.async(appManager.getHandle(app),
          handleId, index, keyHandleRef, onResult);
      } else {
        this.safeCore.appendable_data_nth_data_sign_key.async(appManager.getHandle(app),
          handleId, index, keyHandleRef, onResult);
      }
    });
  }

  restore(handleId, index) {
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Restore :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      this.safeCore.appendable_data_restore_nth_deleted_data.async(handleId, index, onResult);
    });
  }

  append(app, appendableDataHandle, dataIdHandle) {
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Append :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      this.safeCore.appendable_data_append.async(appManager.getHandle(app),
        appendableDataHandle, dataIdHandle, onResult);
    });
  }

  getLength(handleId, fromDeleted) {
    return new Promise((resolve, reject) => {
      const lengthRef = ref.alloc(size_t);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get length :: ${err || res}`);
          return reject(err || res);
        }
        resolve(lengthRef.deref());
      };
      if (fromDeleted) {
        this.safeCore.appendable_data_num_of_deleted_data.async(handleId, lengthRef, onResult);
      } else {
        this.safeCore.appendable_data_num_of_data.async(handleId, lengthRef, onResult);
      }
    });
  }

  removeDataAt(handleId, index, fromDeleted) {
    return new Promise((resolve, reject) => {
      const onResult = async(err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Remove at index :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      if (fromDeleted) {
        this.safeCore.appendable_data_remove_nth_deleted_data.async(handleId, index, onResult);
      } else {
        this.safeCore.appendable_data_remove_nth_data.async(handleId, index, onResult);
      }
    });
  }

  clearAll(handleId, fromDeleted) {
    return new Promise((resolve, reject) => {
      const onResult = async(err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Clear all :: ${err || res}`);
          reject(err);
        }
        resolve();
      };
      if (fromDeleted) {
        this.safeCore.appendable_data_clear_deleted_data.async(handleId, onResult);
      } else {
        this.safeCore.appendable_data_clear_data.async(handleId, onResult);
      }
    });
  }

  getVersion(handleId) {
    return new Promise((resolve, reject) => {
      const versionRef = ref.alloc(u64);
      this.safeCore.appendable_data_version.async(handleId, versionRef, (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Get version :: ${err || res}`);
          return reject(err || res);
        }
        resolve(versionRef.deref());
      });
    });
  }

  isOwner(app, handleId) {
    return new Promise((resolve, reject) => {
      const boolRef = ref.alloc(bool);
      this.safeCore.appendable_data_is_owned.async(appManager.getHandle(app),
        handleId, boolRef, (err, res) => {
          if (err || res !== 0) {
            log.error(`FFI :: Appendable data :: Check owner :: ${err || res}`);
            return reject(err || res);
          }
          resolve(boolRef.deref());
        });
    });
  }

  delete(app, handleId) {
    return new Promise((resolve, reject) => {
      this.safeCore.appendable_data_delete.async(appManager.getHandle(app),
        handleId, (err, res) => {
          if (err || res !== 0) {
            log.error(`FFI :: Appendable data :: Delete :: ${err || res}`);
            return reject(err || res);
          }
          resolve();
        });
    });
  }

  serialise(handleId) {
    return misc.serialiseAppendableData(handleId);
  }

  deserialise(data) {
    return misc.deserialiseAppendableData(data);
  }

  dropHandle(handleId) {
    return new Promise((resolve, reject) => {
      this.safeCore.appendable_data_free.async(handleId, (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Appendable data :: Drop handle :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      });
    });
  }

}

const appendableData = new AppendableData();
export default appendableData;
