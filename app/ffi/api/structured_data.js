import ref from 'ref';

import misc from './misc';
import FfiApi from '../ffi_api';
import appManager from '../util/app_manager';
import {errorCodeLookup} from '../../server/error_code_lookup';
const int32 = ref.types.int32;
const u8 = ref.types.uint8;
const u64 = ref.types.uint64;
const size_t = ref.types.size_t;
const Void = ref.types.void;
const bool = ref.types.bool;

const AppHandle = ref.refType(Void);
const u8Pointer = ref.refType(u8);
const u64Pointer = ref.refType(u64);
const boolPointer = ref.refType(bool);
const size_tPointer = ref.refType(size_t);
const PointerToU8Pointer = ref.refType(u8Pointer);

class StructuredData extends FfiApi {

  constructor() {
    super();
  }

  getFunctionsToRegister() {
    return {
      'struct_data_new': [int32, [AppHandle, u64, u8Pointer, u64, u64, u8Pointer, size_t, u64Pointer]],
      'struct_data_fetch': [int32, [AppHandle, u64, u64Pointer]],
      'struct_data_extract_data_id': [int32, [u64, u64Pointer]],
      'struct_data_validate_size': [int32, [u64, boolPointer]],
      'struct_data_new_data': [int32, [AppHandle, u64, u64, u8Pointer, size_t]],
      'struct_data_extract_data': [int32, [AppHandle, u64, PointerToU8Pointer, size_tPointer, size_tPointer]],
      'struct_data_nth_version': [int32, [AppHandle, u64, size_t, PointerToU8Pointer, size_tPointer, size_tPointer]],
      'struct_data_num_of_versions': [int32, [u64, size_tPointer]],
      'struct_data_put': [int32, [AppHandle, u64]],
      'struct_data_post': [int32, [AppHandle, u64]],
      'struct_data_delete': [int32, [AppHandle, u64]],
      'struct_data_make_unclaimable': [int32, [AppHandle, u64]],
      'struct_data_version': [int32, [u64, u64Pointer]],
      'struct_data_is_owned': [int32, [AppHandle, u64, boolPointer]],
      'struct_data_free': [int32, [u64]]
    };
  }

  save(app, structuredDataHandle, isPost) {
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      if (isPost) {
        this.safeCore.struct_data_post.async(appManager.getHandle(app), structuredDataHandle, onResult);
      } else {
        this.safeCore.struct_data_put.async(appManager.getHandle(app), structuredDataHandle, onResult);
      }
    });
  }

  asDataId(structuredDataHandle) {
    return new Promise((resolve, reject) => {
      let handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      this.safeCore.struct_data_extract_data_id.async(structuredDataHandle, handleRef, onResult);
    });
  }

  asStructuredData(app, dataIdHandle) {
    return new Promise((resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      this.safeCore.struct_data_fetch.async(appManager.getHandle(app), dataIdHandle, handleRef, onResult);
    });
  }

  getDataVersionsCount(handleId) {
    return new Promise((resolve, reject) => {
      let countRef = ref.alloc(size_t);
      const onResult = (err, res) => {
        if (err) {
          reject(err);
        } else if (errorCodeLookup(res) === 'FfiError::InvalidStructuredDataTypeTag') {
          resolve();
        } else if (res !== 0) {
          reject(res);
        } else {
          resolve(countRef.deref());
        }
      };
      this.safeCore.struct_data_num_of_versions.async(handleId, countRef, onResult);
    });
  }

  isSizeValid(handleId) {
    return new Promise((resolve, reject) => {
      let isValidRef = ref.alloc(bool);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(isValidRef.deref());
      };
      this.safeCore.struct_data_validate_size.async(handleId, isValidRef, onResult);
    });
  }

  create(app, id, tagType, cipherOptHandle, data, version = 0) {
    return new Promise(async (resolve, reject) => {
      if (!app) {
        reject('app parameter missing');
      }
      let handleRef = ref.alloc(u64);
      this.safeCore.struct_data_new.async(appManager.getHandle(app), tagType, id, version,
        cipherOptHandle, data, (data ? data.length : 0), handleRef, (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          resolve(handleRef.deref());
        });
    });
  }

  update(app, handleId, cipherOptHandle, data) {
    return new Promise(async (resolve, reject) => {
      if (!app) {
        reject('app parameter missing');
      }
      try {
        const onResult = async (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          try {
            resolve();
          } catch(e) {
            reject(e);
          }
        };
        this.safeCore.struct_data_new_data.async(appManager.getHandle(app), handleId,
          cipherOptHandle, data, (data ? data.length : 0), onResult);
      } catch(e) {
        reject(e);
      }
    });
  }

  read(app, handleId, version) {
    return new Promise((resolve, reject) => {
      try {
        const dataPointerRef = ref.alloc(PointerToU8Pointer);
        const sizeRef = ref.alloc(size_t);
        const capacityRef = ref.alloc(size_t);
        const onResult = (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          const capacity = capacityRef.deref();
          const size = sizeRef.deref();
          let data;
          if (size > 0) {
            let dataPointer = dataPointerRef.deref();
            data = Buffer.concat([ref.reinterpret(dataPointer, size)]);
            misc.dropVector(dataPointer, size, capacity);
          }
          resolve(data);
        };
        if (isNaN(version)) {
          this.safeCore.struct_data_extract_data.async(appManager.getHandle(app), handleId,
            dataPointerRef, sizeRef, capacityRef, onResult);
        } else {
          this.safeCore.struct_data_nth_version.async(appManager.getHandle(app), handleId,
            version, dataPointerRef, sizeRef, capacityRef, onResult);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  getVersion(handleId) {
    return new Promise((resolve, reject) => {
      let versionRef = ref.alloc(u64);
      this.safeCore.struct_data_version.async(handleId, versionRef, (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(versionRef.deref());
      });
    });
  }

  isOwner(app, handleId) {
    return new Promise((resolve, reject) => {
      let boolRef = ref.alloc(bool);
      this.safeCore.struct_data_is_owned.async(appManager.getHandle(app), handleId, boolRef, (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(boolRef.deref());
      });
    });
  }

  delete(app, handleId, unclaimable = false) {
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      if (unclaimable) {
        this.safeCore.struct_data_make_unclaimable.async(appManager.getHandle(app), handleId, onResult);
      } else {
        this.safeCore.struct_data_delete.async(appManager.getHandle(app), handleId, onResult);
      }
    });
  }

  dropHandle(handleId) {
    return new Promise((resolve, reject) => {
      this.safeCore.struct_data_free.async(handleId, (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      });
    });
  }

  serialise(handleId) {
    return misc.serialiseStructuredData(handleId);
  }

  deserialise(data) {
    return misc.deserialiseStructuredData(data);
  }
}

const structuredData = new StructuredData();
export default structuredData;
