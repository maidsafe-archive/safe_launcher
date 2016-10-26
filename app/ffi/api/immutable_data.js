import ref from 'ref';

import misc from './misc';
import FfiApi from '../ffi_api';
import cipherOpts from './cipher_opts';
import appManager from '../util/app_manager';
import { ENCRYPTION_TYPE } from '../model/enum';
import { log } from '../../logger/log';

const int32 = ref.types.int32;
const u8 = ref.types.uint8;
const u64 = ref.types.uint64;
const Void = ref.types.void;
const size_t = ref.types.size_t;

const VoidPointer = ref.refType(Void);
const u8Pointer = ref.refType(u8);
const u64Pointer = ref.refType(u64);
const PointerToU8Pointer = ref.refType(u8Pointer);
const size_tPointer = ref.refType(size_t);

class ImmutableData extends FfiApi {

  constructor() {
    super();
  }

  getFunctionsToRegister() {
    return {
      'immut_data_new_self_encryptor': [int32, [VoidPointer, u64Pointer]],
      'immut_data_write_to_self_encryptor': [int32, [u64, u8Pointer, u64]],
      'immut_data_close_self_encryptor': [int32, [VoidPointer, u64, u64, u64Pointer]],
      'immut_data_fetch_self_encryptor': [int32, [VoidPointer, u64, u64Pointer]],
      'immut_data_size': [int32, [u64, u64Pointer]],
      'immut_data_read_from_self_encryptor': [int32, [u64, u64, u64, PointerToU8Pointer, size_tPointer, size_tPointer]],
      'immut_data_self_encryptor_writer_free': [int32, [u64]],
      'immut_data_self_encryptor_reader_free': [int32, [u64]]
    };
  }

  getWriterHandle(app) {
    const self = this;
    const executor = (resolve, reject) => {
      if (!app) {
        reject('app parameter missing');
      }
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Immutable data :: Get writer handle :: ${err || res}`);
          return reject(err || res);
        }
        resolve(handleRef.deref());
      };
      self.safeCore.immut_data_new_self_encryptor.async(appManager.getHandle(app), handleRef, onResult);
    };
    return new Promise(executor);
  }

  write(handleId, data) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Immutable data :: Write :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      self.safeCore.immut_data_write_to_self_encryptor.async(handleId, data, data.length, onResult);
    };
    return new Promise(executor);
  }

  closeWriter(app, writerHandleId, cipherOptsHandle) {
    const self = this;
    const executor = async(resolve, reject) => {
      const dataIdRef = ref.alloc(u64);
      try {
        const dataIdRef = ref.alloc(u64);
        const onResult = (err, res) => {
          if (err || res !== 0) {
            log.error(`FFI :: Immutable data :: Close writer :: ${err || res}`);
            return reject(err || res);
          }
          resolve(dataIdRef.deref());
        };
        self.safeCore.immut_data_close_self_encryptor.async(appManager.getHandle(app), writerHandleId,
          cipherOptsHandle, dataIdRef, onResult);
      } catch (e) {
        reject(e);
      }
    };
    return new Promise(executor);
  }

  getReaderHandle(app, dataIdHandle) {
    const self = this;
    const executor = (resolve, reject) => {
      const handleRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Immutable data :: Get reader handle :: ${err || res}`);
          reject(err || res);
        }
        resolve(handleRef.deref());
      };
      self.safeCore.immut_data_fetch_self_encryptor.async(appManager.getHandle(app), dataIdHandle, handleRef, onResult);
    };
    return new Promise(executor);
  }

  getReaderSize(readerId) {
    const self = this;
    const executor = (resolve, reject) => {
      const sizeRef = ref.alloc(u64);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Immutable data :: Get reader size :: ${err || res}`);
          reject(err || res);
        }
        resolve(sizeRef.deref());
      };
      self.safeCore.immut_data_size.async(readerId, sizeRef, onResult);
    };
    return new Promise(executor);
  }

  read(readerId, offset, length) {
    const self = this;
    const executor = (resolve, reject) => {
      const dataRefRef = ref.alloc(PointerToU8Pointer);
      const sizeRef = ref.alloc(size_t);
      const capacityRef = ref.alloc(size_t);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Immutable data :: Read :: ${err || res}`);
          reject(err || res);
        }
        const dataRef = dataRefRef.deref();
        const size = sizeRef.deref();
        const capacity = capacityRef.deref();
        const data = Buffer.concat([ref.reinterpret(dataRef, size)]);
        misc.dropVector(dataRef, size, capacity);
        resolve(data);
      };
      self.safeCore.immut_data_read_from_self_encryptor.async(readerId, offset, length,
        dataRefRef, sizeRef, capacityRef, onResult);
    };
    return new Promise(executor);
  }

  dropReader(readerId) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Immutable data :: Drop reader :: ${err || res}`);
          reject(err || res);
        }
        resolve();
      };
      self.safeCore.immut_data_self_encryptor_reader_free.async(readerId, onResult);
    };
    return new Promise(executor);
  }

  dropWriterHandle(writerId) {
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: Immutable data :: Drop writer :: ${err || res}`);
          reject(err || res);
        }
        resolve();
      };
      self.safeCore.immut_data_self_encryptor_writer_free.async(writerId, onResult);
    };
    return new Promise(executor);
  }

}

const immutableData = new ImmutableData();
export default immutableData;
