import ref from 'ref';
import StructType from 'ref-struct';

const int64 = ref.types.int64;
const u64 = ref.types.uint64;
/* eslint-disable camelcase */
const size_t = ref.types.size_t;
const bool = ref.types.bool;
const u8Pointer = ref.refType(ref.types.uint8);

export const DirectoryMetadata = new StructType({
  name: u8Pointer,
  name_len: size_t,
  name_cap: size_t,
  user_metadata: u8Pointer,
  user_metadata_len: size_t,
  user_metadata_cap: size_t,
  is_private: bool,
  is_versioned: bool,
  creation_time_sec: int64,
  creation_time_nsec: int64,
  modification_time_sec: int64,
  modification_time_nsec: int64
});

export const FileMetadata = new StructType({
  name: u8Pointer,
  name_len: size_t,
  name_cap: size_t,
  user_metadata: u8Pointer,
  user_metadata_len: size_t,
  user_metadata_cap: size_t,
  size: u64,
  creation_time_sec: int64,
  creation_time_nsec: int64,
  modification_time_sec: int64,
  modification_time_nsec: int64
});

export const FileDetails = new StructType({
  content: u8Pointer,
  content_len: size_t,
  content_cap: size_t,
  metadata: ref.refType(FileMetadata)
});
/* eslint-enable camelcase */

const computeTime = (seconds, nanoSeconds) => (
  new Date((seconds * 1000) + Math.floor(nanoSeconds / 1000000)).toISOString()
);


export const error = (msg) => {
  const promise = new Promise((resolve, reject) => {
    reject(msg);
  });
  return promise;
};

export const derefFileMetadataStruct = (metadataStruct) => {
  let fileName = '';
  let fileMetadata = '';
  if (metadataStruct.name_len > 0) {
    fileName = ref.reinterpret(metadataStruct.name, metadataStruct.name_len).toString();
  }
  if (metadataStruct.user_metadata_len > 0) {
    fileMetadata = ref.reinterpret(metadataStruct.user_metadata,
      metadataStruct.user_metadata_len).toString();
  }
  return {
    name: fileName,
    metadata: fileMetadata,
    size: metadataStruct.size,
    createdOn: computeTime(metadataStruct.creation_time_sec, metadataStruct.creation_time_nsec),
    modifiedOn: computeTime(metadataStruct.modification_time_sec,
      metadataStruct.modification_time_nsec)
  };
};

export const derefDirectoryMetadataStruct = (metadataStruct) => {
  let dirName = '';
  let dirMetadata = '';
  if (metadataStruct.name_len > 0) {
    dirName = ref.reinterpret(metadataStruct.name, metadataStruct.name_len).toString();
  }
  if (metadataStruct.user_metadata_len > 0) {
    dirMetadata = ref.reinterpret(metadataStruct.user_metadata,
      metadataStruct.user_metadata_len).toString();
  }
  return {
    name: dirName,
    metadata: dirMetadata,
    isPrivate: metadataStruct.is_private,
    isVersioned: metadataStruct.is_versioned,
    createdOn: computeTime(metadataStruct.creation_time_sec, metadataStruct.creation_time_nsec),
    modifiedOn: computeTime(metadataStruct.modification_time_sec,
      metadataStruct.modification_time_nsec)
  };
};

export const consumeStringListHandle = async(safeCore, handle) => {
  const exec = (resolve, reject) => {
    const getItemAt = async(index) => {
      const executor = (res, rej) => {
        const onResult = (err, str) => {
          if (err) {
            return rej(err);
          }
          res(str);
        };
        safeCore.string_list_at.async(handle, index, onResult);
      };
      return new Promise(executor);
    };
    const onResult = async(err, length) => {
      if (err) {
        return reject(err);
      }
      const list = [];
      let i = 0;
      let temp;
      while (i < length) {
        temp = await getItemAt(i);
        list.push(temp);
        i++;
      }
      safeCore.string_list_drop.async(handle, () => {});
      resolve(list);
    };
    safeCore.string_list_len.async(handle, onResult);
  };
  return new Promise(exec);
};

export const parseExceptionForLog = e => (
  (typeof e.message === 'object') ? JSON.stringify(e.message) : e.message
);
