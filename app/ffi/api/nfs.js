'use strict';

import ref from 'ref';
import uuid from 'uuid';

import {FileMetadata, DirectoryMetadata, FileDetails,
       error, derefFileMetadataStruct, derefDirectoryMetadataStruct} from '../util/utils';
import FfiApi from '../ffi_api';
import appManager from '../util/app_manager';

const Void = ref.types.void;
const int32 = ref.types.int32;
const int64 = ref.types.int64;
const u64 = ref.types.uint64;
const bool = ref.types.bool;
const u8Pointer = ref.refType(ref.types.uint8);
const AppHandle = ref.refType(ref.types.void);

const DirectoryMetadataHandle = ref.refType(DirectoryMetadata);
const VoidPointerHandle = ref.refType(Void);
const PointerToVoidPointer = ref.refType(ref.refType(Void));
const FileMetadataHandle = ref.refType(FileMetadata);
const PointerToFileMetadataPointer = ref.refType(FileMetadataHandle);
const FileDetailsHandle = ref.refType(FileDetails);
const PointerToFileDetailsPointer = ref.refType(FileDetailsHandle);

class NFS extends FfiApi {
  constructor() {
    super();
    this.writerHolder = new Map();
  }


  getFunctionsToRegister() {
    return {
      'directory_details_get_metadata': [DirectoryMetadataHandle, [VoidPointerHandle]],
      'directory_details_get_sub_directories_len': [u64, [VoidPointerHandle]],
      'directory_details_get_sub_directory_at': [DirectoryMetadataHandle, [VoidPointerHandle, u64]],
      'directory_details_drop': [Void, [VoidPointerHandle]],
      'directory_details_get_files_len': [u64, [VoidPointerHandle]],
      'directory_details_get_file_at': [FileMetadataHandle, [VoidPointerHandle, u64]],
      'nfs_create_dir': [int32, [AppHandle, u8Pointer, u64, u8Pointer, u64, bool, bool, bool]],
      'nfs_delete_dir': [int32, [AppHandle, u8Pointer, u64, bool]],
      'nfs_get_dir': [int32, [AppHandle, u8Pointer, u64, bool, PointerToVoidPointer]],
      'nfs_modify_dir': [int32, [AppHandle, u8Pointer, u64, bool, u8Pointer, u64, u8Pointer, u64]],
      'nfs_move_dir': [int32, [AppHandle, u8Pointer, u64, bool, u8Pointer, u64, bool, bool]],
      'nfs_create_file': [int32, [AppHandle, u8Pointer, u64, u8Pointer, u64, bool, PointerToVoidPointer]],
      'nfs_writer_write': [int32, [VoidPointerHandle, u8Pointer, u64]],
      'nfs_writer_close': [int32, [VoidPointerHandle]],
      'nfs_delete_file': [int32, [AppHandle, u8Pointer, u64, bool]],
      'nfs_modify_file': [int32, [AppHandle, u8Pointer, u64, bool, u8Pointer, u64, u8Pointer, u64, u8Pointer, u64]],
      'nfs_move_file': [int32, [AppHandle, u8Pointer, u64, bool, u8Pointer, u64, bool, bool]],
      'nfs_get_file_metadata': [int32, [AppHandle, u8Pointer, u64, bool, PointerToFileMetadataPointer]],
      'file_metadata_drop': [Void, [FileMetadataHandle]],
      'nfs_get_file': [int32, [AppHandle, int64, int64, u8Pointer, u64, bool, bool, PointerToFileDetailsPointer]],
      'file_details_drop': [Void, [FileDetailsHandle]]
    };
  }

  derefDirectoryDetailsHandle(dirDetailsHandle) {
    const self = this;

    const getSubDirectoriesLength = () => {
      const executor = (resolve, reject) => {
        const onResult = (err, len) => {
          if (err) {
            return reject(err);
          }
          resolve(len);
        };
        self.safeCore.directory_details_get_sub_directories_len.async(dirDetailsHandle, onResult);
      };
      return new Promise(executor);
    };

    const getFileCount = () => {
      const executor = (resolve, reject) => {
        const onResult = (err, len) => {
          if (err) {
            return reject(err);
          }
          resolve(len);
        };
        self.safeCore.directory_details_get_files_len.async(dirDetailsHandle, onResult);
      };
      return new Promise(executor);
    };

    const getSubDirectoryAt = (index) => {
      const executor = (resolve, reject) => {
        const onResult = (err, handle) => {
          if (err) {
            return reject(err);
          }
          resolve(derefDirectoryMetadataStruct(handle.deref()));
        };
        self.safeCore.directory_details_get_sub_directory_at.async(dirDetailsHandle, index, onResult);
      };
      return new Promise(executor);
    };

    const getSubDirectories = async() => {
      const subDirectoriesLength = await getSubDirectoriesLength();
      let i = 0;
      let subDirectories = [];
      let directoryMetadata;
      while (i < subDirectoriesLength) {
        directoryMetadata = await getSubDirectoryAt(i);
        subDirectories.push(directoryMetadata);
        i++;
      }
      return subDirectories;
    };

    const getFileAt = (index) => {
      const executor = (resolve, reject) => {
        const onResult = (err, handle) => {
          if (err) {
            return reject(err);
          }
          resolve(derefFileMetadataStruct(handle.deref()));
        };
        self.safeCore.directory_details_get_file_at.async(dirDetailsHandle, index, onResult);
      };
      return new Promise(executor);
    };

    const getFiles = async() => {
      const filesCount = await getFileCount();
      let i = 0;
      let files = [];
      let fileMetadata;
      while (i < filesCount) {
        fileMetadata = await getFileAt(i);
        files.push(fileMetadata);
        i++;
      }
      return files;
    };

    const executor = (resolve, reject) => {
      self.safeCore.directory_details_get_metadata.async(dirDetailsHandle, (err, metadataHandle) => {
        if (err) {
          return reject(err);
        }
        const dereference = async() => {
          const metadata = derefDirectoryMetadataStruct(metadataHandle.deref());
          const subDirectories = await getSubDirectories();
          const files = await getFiles();
          self.safeCore.directory_details_drop.async(dirDetailsHandle, (err) => {
            if (err) {
              console.log('Error in dropping directory details handle', err);
            }
          });
          resolve({
            info: metadata,
            subDirectories: subDirectories,
            files: files
          });
        };
        dereference();
      });
    };
    return new Promise(executor);
  }

  createDirectory(app, path, metadata = '', isPrivate = false, isVersioned = false, isShared = false) {
    if (!path || !path.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      const pathBuff = new Buffer(path);
      const metadataBuff = new Buffer(metadata);
      self.safeCore.nfs_create_dir.async(appManager.getHandle(app), pathBuff, pathBuff.length,
        metadataBuff, metadata.length, isPrivate, isVersioned, isShared, onResult);
    };
    return new Promise(executor);
  }

  getDirectory(app, path, isShared = false) {
    if (!path || !path.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const dirDetailsHandle = ref.alloc(PointerToVoidPointer);

    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        const dirDetails = dirDetailsHandle.deref();
        resolve(self.derefDirectoryDetailsHandle(dirDetails));
      };
      const pathBuff = new Buffer(path);
      self.safeCore.nfs_get_dir.async(appManager.getHandle(app), pathBuff, pathBuff.length,
        isShared, dirDetailsHandle, onResult);
    };
    return new Promise(executor);
  }

  deleteDirectory(app, path, isShared = false) {
    if (!path || !path.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      const pathBuff = new Buffer(path);
      self.safeCore.nfs_delete_dir.async(appManager.getHandle(app), pathBuff, pathBuff.length,
        isShared, onResult);
    };
    return new Promise(executor);
  }

  updateDirectory(app, path, isShared, newName, metadata) {
    if (!path || !path.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      const pathBuff = new Buffer(path);
      const nameBuff = newName ? new Buffer(newName) : null;
      const metadataBuff = metadataBuff ? new Buffer(metadataBuff) : null;
      self.safeCore.nfs_modify_dir.async(appManager.getHandle(app), pathBuff, pathBuff.length,
        isShared, nameBuff, (nameBuff ? nameBuff.length : 0),
        metadataBuff, (metadataBuff ? metadataBuff.length : 0), onResult);
    };
    return new Promise(executor);
  }

  moveDir(app, srcPath, isSrcPathShared = false, destPath, isDestPathShared = false, isCopy = false) {
    if (!srcPath || !srcPath.trim() || !destPath || !destPath.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      const srcPathBuff = new Buffer(srcPath);
      const destPathBuff = new Buffer(destPath);
      self.safeCore.nfs_move_dir.async(appManager.getHandle(app),
        srcPathBuff, srcPathBuff.length, isSrcPathShared,
        destPathBuff, destPathBuff.length, isDestPathShared,
        isCopy, onResult);
    };
    return new Promise(executor);
  }

  createFile(app, filePath, metadata, isShared=false) {
    if (!filePath || !filePath.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const writerVoidPointer = ref.alloc(PointerToVoidPointer);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        const key = {writerId: uuid.v4()};
        self.writerHolder.set(key, writerVoidPointer.deref());
        resolve(key);
      };
      const filePathBuff = new Buffer(filePath);
      let metadataBuff = null;
      if (metadata) {
        metadataBuff = new Buffer(metadata);
      }
      self.safeCore.nfs_create_file.async(appManager.getHandle(app),
        filePathBuff, filePathBuff.length,
        metadataBuff, (metadataBuff ? metadataBuff.length : 0),
        isShared,
        writerVoidPointer, onResult);
    };
    return new Promise(executor);
  }

  writeToFile(writerKey, data) {
    if (!this.writerHolder.has(writerKey)) {
      return error('Writer not available');
    }
    if (!data) {
      return error('data is undefined');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      self.safeCore.nfs_writer_write.async(self.writerHolder.get(writerKey), data, data.length, onResult);
    };
    return new Promise(executor);
  }

  closeWriter(writerKey) {
    if (!this.writerHolder.has(writerKey)) {
      return error('Writer not available');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        self.writerHolder.delete(writerKey);
        resolve();
      };
      self.safeCore.nfs_writer_close.async(self.writerHolder.get(writerKey), onResult);
    };
    return new Promise(executor);
  }

  deleteFile(app, filePath, isShared = false) {
    if (!filePath || !filePath.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };
      const pathBuff = new Buffer(filePath);
      self.safeCore.nfs_delete_file.async(appManager.getHandle(app),
        pathBuff, pathBuff.length, isShared, onResult);
    };
    return new Promise(executor);
  }

  updateFileMetadata(app, filePath, isShared = false, newName, metadata) {
    if (!filePath || !filePath.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };

      const pathBuff = new Buffer(filePath);
      const nameBuff = newName ? new Buffer(newName) : null;
      const metadataBuff = metadata ? new Buffer(metadata) : null;
      self.safeCore.nfs_modify_file.async(appManager.getHandle(app), pathBuff, pathBuff.length,
        isShared, nameBuff, (nameBuff ? nameBuff.length : 0),
        metadataBuff, (metadataBuff ? metadataBuff.length : 0),
        null, 0, onResult);
    };
    return new Promise(executor);
  }

  moveFile(app, srcFilePath, isSrcPathShared = false, destPath, isDestPathShared = false, isCopy = false) {
    if (!srcFilePath || !srcFilePath.trim() || !destPath || !destPath.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        resolve();
      };

      const srcPathBuff = new Buffer(srcFilePath);
      const destPathBuff = new Buffer(destPath);
      self.safeCore.nfs_move_file.async(appManager.getHandle(app),
        srcPathBuff, srcPathBuff.length, isSrcPathShared,
        destPathBuff, destPathBuff.length, isDestPathShared,
        isCopy, onResult);
    };
    return new Promise(executor);
  }

  getFileMetadata(app, path, isShared) {
    if (!path || !path.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const fileMetadataPointerHandle = ref.alloc(PointerToFileMetadataPointer);
    const executor = (resolve, reject) => {
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        try {
          const fileMetadataHandle = fileMetadataPointerHandle.deref();
          const fileMetadataRef = ref.alloc(FileMetadataHandle, fileMetadataHandle).deref();
          const metadata = derefFileMetadataStruct(fileMetadataRef.deref());
          self.safeCore.file_metadata_drop.async(fileMetadataHandle, (e) => {});
          resolve(metadata);
        } catch(e) {
          console.error(e);
        }
      };

      const pathBuff = new Buffer(path);
      self.safeCore.nfs_get_file_metadata.async(appManager.getHandle(app),
        pathBuff, pathBuff.length, isShared, fileMetadataPointerHandle, onResult);
    };
    return new Promise(executor);
  }

  readFile(app, path, isShared=false, offset = 0, length = 0) {
    if (!path || !path.trim()) {
      return error('Invalid parameters');
    }
    const self = this;
    const executor = (resolve, reject) => {
      if (length === 0) {
        return resolve(new Buffer(0));
      }
      const fileDetailsPointerHandle = ref.alloc(PointerToFileDetailsPointer);
      const onResult = (err, res) => {
        if (err || res !== 0) {
          return reject(err || res);
        }
        const fileDetailsHandle = fileDetailsPointerHandle.deref();
        const handle = ref.alloc(FileDetailsHandle, fileDetailsHandle).deref();
        const fileDetails = handle.deref();
        const data = Buffer.concat([ref.reinterpret(fileDetails.content, fileDetails.content_len)]);
        self.safeCore.file_details_drop.async(handle, (e) => {
          if (e) {
            console.error(e);
          }
        });
        resolve(data);
      };
      const pathBuffer = new Buffer(path);
      self.safeCore.nfs_get_file.async(appManager.getHandle(app), offset, length,
        pathBuffer, pathBuffer.length, isShared, false, fileDetailsPointerHandle, onResult);
    };
    return new Promise(executor);
  }

  drop = async () => {
    try {
      for (let key in this.writerHolder.keys()) {
        await this.closeWriter(key);
      }
    } catch(e) {
      console.log('Error', e);
    }
  }
}

const nfs = new NFS();
export default nfs;
