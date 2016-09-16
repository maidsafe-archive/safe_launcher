import ref from 'ref';

import FfiApi from '../ffi_api';

const Void = ref.types.void;
const int32 = ref.types.int32;
const u64 = ref.types.uint64;
const u8 = ref.types.uint8;
const bool = ref.types.bool;
const size_t = ref.types.size_t;
const u8Pointer = ref.refType(u8);
const u64Pointer = ref.refType(u64);
const size_tPointer = ref.refType(size_t);

const PointerToU8Pointer = ref.refType(u8Pointer);

class Misc extends FfiApi {

  constructor() {
    super();
  }

  getFunctionsToRegister() {
    return {
      'init_logging': [int32, []],
      'misc_encrypt_key_free': [int32, [u64]],
      'misc_sign_key_free': [int32, [u64]],
      'misc_serialise_data_id': [int32, [u64, PointerToU8Pointer, size_tPointer, size_tPointer]],
      'misc_deserialise_data_id': [int32, [u8Pointer, u64, u64Pointer]],
      'misc_serialise_appendable_data': [int32, [u64, PointerToU8Pointer, size_tPointer, size_tPointer]],
      'misc_u8_ptr_free': [Void, [u8Pointer, u64, u64]]
    };
  }

  dropEncryptKeyHandle(handleId) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      self.safeCore.misc_encrypt_key_free.async(handleId, onResult);
    };
    return new Promise(executor);
  }

  dropSignKeyHandle(handleId) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      self.safeCore.misc_sign_key_free.async(handleId, onResult);
    };
    return new Promise(executor);
  }

  dropVector(dataPointer, size, capacity) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err) => {
        if (err) {
          console.error(err);
        }
        resolve();
      };
      try {
        self.safeCore.misc_u8_ptr_free.async(dataPointer, size, capacity, onResult);
      } catch(e) {
        console.error(e);
      }
    };
    return new Promise(executor);
  }

  _serialise(handleId, type) {
    return new Promise((resolve, reject) => {
      const dataPointerRef = ref.alloc(PointerToU8Pointer);
      const sizeRef = ref.alloc(size_t);
      const capacityRef = ref.alloc(size_t);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        const size = sizeRef.deref();
        const capacity = capacityRef.deref();
        const dataPointer = dataPointerRef.deref();
        const data = Buffer.concat([ref.reinterpret(dataPointer, size)]);
        this.dropVector(dataPointer, size, capacity);
        resolve(data);
      };
      switch (type) {
        case 0:
          this.safeCore.misc_serialise_data_id.async(handleId, dataPointerRef,
            sizeRef, capacityRef, onResult);
          break;
        case 1:
          this.safeCore.misc_serialise_appendable_data.async(handleId, dataPointerRef,
            sizeRef, capacityRef, onResult);
          break;
        default:
      }
    });
  }

  serialiseDataId(handleId) {
    return this._serialise(handleId, 0);
  }

  serialiseAppendableData(handleId) {
    return this._serialise(handleId, 1);
  }

  deserialiseDataId(data) {
    const self = this;
    const executor = (resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      self.safeCore.misc_deserialise_data_id.async(data, data.length, handleRef, onResult);
    };
    return new Promise(executor);
  }

}

const misc = new Misc();
export default misc;
