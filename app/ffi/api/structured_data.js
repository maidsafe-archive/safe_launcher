import ref from 'ref';

import misc from './misc';
import FfiApi from '../ffi_api';
import cipherOpts from './cipher_opts';
import appManager from '../util/app_manager';
import {ENCRYPTION_TYPE} from '../model/enum';

const int32 = ref.types.int32;
const u8 = ref.types.uint8;
const u64 = ref.types.uint64;
const size_t = ref.types.size_t;
const Void = ref.types.void;

const VoidPointer = ref.refType(Void);
const u8Pointer = ref.refType(u8);
const u64Pointer = ref.refType(u64);
const size_tPointer = ref.refType(size_t);
const PointerToU8Pointer = ref.refType(u8Pointer);

class StructuredData extends FfiApi {

  constructor() {
    super();
  }

  getFunctionsToRegister() {
    return {
      'struct_data_new': [int32, [VoidPointer, u64, u8Pointer, u64, u8Pointer, size_t, u64Pointer]],
      'struct_data_fetch': [int32, [VoidPointer, u64, u64Pointer]],
      'struct_data_extract_data_id': [int32, [u64, u64Pointer]],
      'struct_data_new_data': [int32, [VoidPointer, u64, u64, u8Pointer, size_t]],
      'struct_data_extract_data': [int32, [VoidPointer, u64, PointerToU8Pointer, size_tPointer, size_tPointer]],
      'struct_data_num_of_versions': [int32, [VoidPointer, u64, u64Pointer]],
      'struct_data_nth_version': [int32, [VoidPointer, u64, u64, PointerToU8Pointer, size_tPointer, size_tPointer]],
      'struct_data_put': [int32, [VoidPointer, u64]],
      'struct_data_post': [int32, [VoidPointer, u64]],
      'struct_data_delete': [int32, [VoidPointer, u64]],
      'struct_data_free': [int32, [u64]]
    };
  }

  _getCipherOpt(encryptionType, publicKeyHandle) {
    switch (encryptionType) {
      case ENCRYPTION_TYPE.PLAIN:
        return cipherOpts.getCipherOptPlain();
      case ENCRYPTION_TYPE.SYMMETRIC:
        return cipherOpts.getCipherOptSymmetric();
      case ENCRYPTION_TYPE.ASYMMETRIC:
        return cipherOpts.getCipherOptAsymmetric(publicKeyHandle);
    }
  }

  _put(app, structuredDataHandle) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      self.safeCore.struct_data_put.async(appManager.getHandle(app), structuredDataHandle, onResult);
    };
    return new Promise(executor);
  }

  _post(app, structuredDataHandle) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      self.safeCore.struct_data_post.async(appManager.getHandle(app), structuredDataHandle, onResult);
    };
    return new Promise(executor);
  }

  _asDataId(structuredDataHandle) {
    const self = this;
    const executor = (resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      self.safeCore.struct_data_extract_data_id.async(structuredDataHandle, handleRef, onResult);
    };
    return new Promise(executor);
  }

  _asStructuredData(app, dataIdHandle) {
    const self = this;
    const executor = (resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      self.safeCore.struct_data_fetch.async(appManager.getHandle(app), dataIdHandle, handleRef, onResult);
    };
    return new Promise(executor);
  }

  create(app, id, tagType, encryptionType, data, publicKeyHandle) {
    const self = this;
    const executor = async (resolve, reject) => {
      if (!app) {
        reject('app parameter missing');
      }
      const handleRef = ref.alloc(u64);
      try {
        const cipherOptHandle = await self._getCipherOpt(encryptionType, publicKeyHandle);
        const onResult = async (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          cipherOpts.dropHandle(cipherOptHandle);
          const structDataHandle = handleRef.deref();
          await self._put(app, structDataHandle);
          const dataIdHandle = await self._asDataId(structDataHandle);
          self.safeCore.struct_data_free.async(structDataHandle, (e) => {});
          resolve(dataIdHandle);
        };
        self.safeCore.struct_data_new.async(appManager.getHandle(app), tagType, id,
          cipherOptHandle, data, (data ? data.length : 0), handleRef, onResult);
      } catch(e) {
        console.error(e);
        reject(e);
      }
    };
    return new Promise(executor);
  }

  update(app, dataIdHandle, encryptionType, data, publicKeyHandle) {
    const self = this;
    const executor = async (resolve, reject) => {
      if (!app) {
        reject('app parameter missing');
      }
      try {
        const structuredDataHandle = await self._asStructuredData(app, dataIdHandle);
        const cipherOptHandle = await self._getCipherOpt(encryptionType, publicKeyHandle);
        const onResult = async (err, res) => {
          if (err || res !== 0) {
            return reject(err || res);
          }
          try {
            cipherOpts.dropHandle(cipherOptHandle);
            await self._post(app, structuredDataHandle);
            self.safeCore.struct_data_free.async(structuredDataHandle, (e) => {});
            resolve(dataIdHandle);
          } catch(e) {
            reject(e);
          }
        };
        self.safeCore.struct_data_new_data.async(appManager.getHandle(app), structuredDataHandle,
          cipherOptHandle, data, (data ? data.length : 0), onResult);
      } catch(e) {
        reject(e);
      }
    };
    return new Promise(executor);
  }

  read(app, handleId) {
    const self = this;
    const executor = async (resolve, reject) => {
      try {
        const structuredDataHandleId = await self._asStructuredData(app, handleId);
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
            const dataPointer = dataPointerRef.deref();
            data = Buffer.concat([ref.reinterpret(dataPointer, size)]);
            misc.dropVector(dataPointer, size, capacity);
          }
          self.safeCore.struct_data_free.async(structuredDataHandleId, () => {});
          resolve(data);
        };
        self.safeCore.struct_data_extract_data.async(appManager.getHandle(app), structuredDataHandleId,
          dataPointerRef, sizeRef, capacityRef, onResult);
      } catch (e) {
        reject(e);
      }
    };
    return new Promise(executor);
  }
}

const structuredData = new StructuredData();
export default structuredData;
