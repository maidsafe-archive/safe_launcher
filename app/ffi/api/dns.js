import ref from 'ref';

import appManager from '../util/app_manager';
import {
  error, consumeStringListHandle, derefFileMetadataStruct,
  FileDetails, FileMetadata, parseExceptionForLog,
  safeBufferGetter
} from '../util/utils';
import FfiApi from '../ffi_api';
import nfs from './nfs';
import log from '../../logger/log';

const CString = ref.types.CString;
const int32 = ref.types.int32;
const int64 = ref.types.int64;
const u8 = ref.types.uint8;
const u64 = ref.types.uint64;
/* eslint-disable camelcase */
const size_t = ref.types.size_t;
/* eslint-enable camelcase */
const bool = ref.types.bool;
const Void = ref.types.void;
const PointerHandle = ref.refType(Void);
const u8Pointer = ref.refType(u8);
const PointerToVoidPointer = ref.refType(ref.refType(Void));
const FileMetadataHandle = ref.refType(FileMetadata);
const PointerToFileMetadataPointer = ref.refType(FileMetadataHandle);
const FileDetailsHandle = ref.refType(FileDetails);
const PointerToFileDetailsPointer = ref.refType(FileDetailsHandle);

class DNS extends FfiApi {
  getFunctionsToRegister() {
    /* eslint-disable camelcase */
    return {
      dns_register_long_name: [int32, [PointerHandle, u8Pointer, u64]],
      dns_get_long_names: [int32, [PointerHandle, PointerToVoidPointer]],
      dns_delete_long_name: [int32, [PointerHandle, u8Pointer, u64]],
      dns_add_service: [int32,
        [PointerHandle, u8Pointer, size_t, u8Pointer, size_t, u8Pointer, size_t, bool]],
      dns_delete_service: [int32, [PointerHandle, u8Pointer, size_t, u8Pointer, size_t]],
      dns_get_service_dir: [int32,
        [PointerHandle, u8Pointer, size_t, u8Pointer, size_t, PointerToVoidPointer]],
      dns_get_services: [int32, [PointerHandle, u8Pointer, size_t, PointerToVoidPointer]],
      dns_get_file: [int32, [PointerHandle, u8Pointer, size_t, u8Pointer, size_t, u8Pointer,
        size_t, int64, int64, bool, PointerToFileMetadataPointer]],
      dns_get_file_metadata: [int32, [PointerHandle, u8Pointer, size_t, u8Pointer, size_t,
        u8Pointer, size_t, PointerToFileDetailsPointer]],
      string_list_len: [u64, [PointerHandle]],
      string_list_at: [CString, [PointerHandle, u64]],
      string_list_drop: [Void, [PointerHandle]]
    };
    /* eslint-enable camelcase */
  }

  registerLongName(app, longName) {
    if (!longName || !longName.trim()) {
      return error('Invalid parameters');
    }
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: Register longname :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      const longNameBuffer = new Buffer(longName);
      this.safeCore.dns_register_long_name.async(appManager.getHandle(app),
        longNameBuffer, longNameBuffer.length, onResult);
    };
    return new Promise(executor);
  }

  listLongNames(app) {
    if (!app) {
      return error('Application parameter is mandatory');
    }
    return new Promise((resolve, reject) => {
      const listHandle = ref.alloc(PointerHandle);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: List longname :: ${err || res}`);
          return reject(err || res);
        }
        resolve(consumeStringListHandle(this.safeCore, listHandle.deref()));
      };
      this.safeCore.dns_get_long_names.async(appManager.getHandle(app),
        listHandle, onResult);
    });
  }

  deleteLongName(app, longName) {
    if (!app || !longName) {
      return error('Parameters are mandatory');
    }
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: Delete longname :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      const buff = new Buffer(longName);
      this.safeCore.dns_delete_long_name.async(appManager.getHandle(app),
        buff, buff.length, onResult);
    });
  }

  registerService(app, longName, serviceName, dirPath, isShared = false) {
    return new Promise(async(resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: Register service :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      try {
        await nfs.getDirectory(app, dirPath, isShared);
        await this.registerLongName(app, longName);
        const longNameBuffer = new Buffer(longName);
        const serviceNameBuffer = new Buffer(serviceName);
        const pathBuffer = new Buffer(dirPath);
        this.safeCore.dns_add_service.async(appManager.getHandle(app),
          longNameBuffer, longNameBuffer.length,
          serviceNameBuffer, serviceNameBuffer.length,
          pathBuffer, pathBuffer.length, isShared,
          onResult);
      } catch (e) {
        reject(e);
      }
    });
  }

  addService(app, longName, serviceName, dirPath, isShared = false) {
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: Add service :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      const longNameBuffer = new Buffer(longName);
      const serviceNameBuffer = new Buffer(serviceName);
      const pathBuffer = new Buffer(dirPath);
      this.safeCore.dns_add_service.async(appManager.getHandle(app),
        longNameBuffer, longNameBuffer.length,
        serviceNameBuffer, serviceNameBuffer.length,
        pathBuffer, pathBuffer.length, isShared,
        onResult);
    });
  }

  listServices(app, longName) {
    return new Promise((resolve, reject) => {
      const listHandle = ref.alloc(PointerHandle);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: List service :: ${err || res}`);
          return reject(err || res);
        }
        resolve(consumeStringListHandle(this.safeCore, listHandle.deref()));
      };
      const longNameBuffer = new Buffer(longName);
      this.safeCore.dns_get_services.async(appManager.getHandle(app),
        longNameBuffer, longNameBuffer.length,
        listHandle, onResult);
    });
  }

  getServiceDirectory(app, longName, serviceName) {
    return new Promise((resolve, reject) => {
      const directoryDetailsHandle = ref.alloc(PointerHandle);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: Get service directory :: ${err || res}`);
          return reject(err || res);
        }
        resolve(nfs.derefDirectoryDetailsHandle(directoryDetailsHandle.deref()));
      };
      const longNameBuffer = new Buffer(longName);
      const serviceNameBuffer = new Buffer(serviceName);
      this.safeCore.dns_get_service_dir.async(appManager.getHandle(app),
        longNameBuffer, longNameBuffer.length,
        serviceNameBuffer, serviceNameBuffer.length,
        directoryDetailsHandle, onResult);
    });
  }

  deleteService(app, longName, serviceName) {
    return new Promise((resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: Delete service :: ${err || res}`);
          return reject(err || res);
        }
        resolve();
      };
      const longNameBuffer = new Buffer(longName);
      const serviceNameBuffer = new Buffer(serviceName);
      this.safeCore.dns_delete_service.async(appManager.getHandle(app),
        longNameBuffer, longNameBuffer.length,
        serviceNameBuffer, serviceNameBuffer.length,
        onResult);
    });
  }

  getFileMetadata(app, longName, serviceName, path) {
    return new Promise((resolve, reject) => {
      const fileMetadataRefRef = ref.alloc(PointerToFileMetadataPointer);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: Get file metadata :: ${err || res}`);
          return reject(err || res);
        }
        try {
          const fileMetadataHandle = fileMetadataRefRef.deref();
          const fileMetadataRef = ref.alloc(FileMetadataHandle, fileMetadataHandle).deref();
          const metadata = derefFileMetadataStruct(fileMetadataRef.deref());
          this.safeCore.file_metadata_drop.async(fileMetadataHandle, () => {});
          resolve(metadata);
        } catch (e) {
          log.warn(`FFI :: DNS :: Get file metadata :: Caught exception - 
            ${parseExceptionForLog(e)}`);
        }
      };
      const longNameBuffer = new Buffer(longName);
      const serviceNameBuffer = new Buffer(serviceName);
      const pathBuffer = new Buffer(path);
      this.safeCore.dns_get_file_metadata.async(appManager.getHandle(app),
        longNameBuffer, longNameBuffer.length,
        serviceNameBuffer, serviceNameBuffer.length,
        pathBuffer, pathBuffer.length,
        fileMetadataRefRef, onResult);
    });
  }

  readFile(app, longName, serviceName, path, offset, length) {
    return new Promise((resolve, reject) => {
      const fileDetailsHandle = ref.alloc(FileDetailsHandle);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          log.error(`FFI :: DNS :: Read file :: ${err || res}`);
          return reject(err || res);
        }
        const fileDetails = new FileDetails(fileDetailsHandle.deref());
        const data = safeBufferGetter(fileDetails, 'content');
        this.safeCore.file_details_drop.async(fileDetailsHandle.deref(), (e) => {
          if (e) {
            log.error(`FFI :: DNS :: File details drop :: ${e}`);
          }
        });
        resolve(data);
      };
      const longNameBuffer = new Buffer(longName);
      const serviceNameBuffer = new Buffer(serviceName);
      const pathBuffer = new Buffer(path);
      this.safeCore.dns_get_file.async(appManager.getHandle(app),
        longNameBuffer, longNameBuffer.length,
        serviceNameBuffer, serviceNameBuffer.length,
        pathBuffer, pathBuffer.length,
        offset, length, false, fileDetailsHandle, onResult);
    });
  }

}

const dns = new DNS();
export default dns;
