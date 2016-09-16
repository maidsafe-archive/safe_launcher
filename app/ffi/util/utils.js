'use strict';

import ref from 'ref';
import StructType from 'ref-struct';

import misc from '../api/misc';

const int64 = ref.types.int64;
const u64 = ref.types.uint64;
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

const computeTime = function(seconds, nanoSeconds) {
  return new Date((seconds * 1000) + Math.floor(nanoSeconds / 1000000)).toISOString();
};


export const error = (msg) => {
  const promise = new Promise((resolve, reject) => {
    reject(msg);
  });
  return promise;
};

export const derefFileMetadataStruct = (metadataStruct) => {
  let name = '';
  let metadata = '';
  if (metadataStruct.name_len > 0) {
    name = ref.reinterpret(metadataStruct.name, metadataStruct.name_len).toString();
  }
  if (metadataStruct.user_metadata_len > 0) {
    metadata = ref.reinterpret(metadataStruct.user_metadata, metadataStruct.user_metadata_len).toString();
  }
  return {
    name: name,
    metadata: metadata,
    size: metadataStruct.size,
    createdOn: computeTime(metadataStruct.creation_time_sec, metadataStruct.creation_time_nsec),
    modifiedOn: computeTime(metadataStruct.modification_time_sec, metadataStruct.modification_time_nsec)
  };
};

export const derefDirectoryMetadataStruct = (metadataStruct) => {
  let name = '';
  let metadata = '';
  if (metadataStruct.name_len > 0) {
    name = ref.reinterpret(metadataStruct.name, metadataStruct.name_len).toString();
  }
  if (metadataStruct.user_metadata_len > 0) {
    metadata = ref.reinterpret(metadataStruct.user_metadata, metadataStruct.user_metadata_len).toString();
  }
  return {
    name: name,
    metadata: metadata,
    isPrivate: metadataStruct.is_private,
    isVersioned: metadataStruct.is_versioned,
    createdOn: computeTime(metadataStruct.creation_time_sec, metadataStruct.creation_time_nsec),
    modifiedOn: computeTime(metadataStruct.modification_time_sec, metadataStruct.modification_time_nsec)
  };
};

export const consumeStringListHandle = async (safeCore, handle) => {
  const executor = (resolve, reject) => {
    const getItemAt = async (index) => {
      const executor = (resolve, reject) => {
        const onResult = (err, str) => {
          if (err) {
            return reject(err);
          }
          resolve(str);
        };
        safeCore.string_list_at.async(handle, index, onResult);
      };
      return new Promise(executor);
    };
    const onResult = async (err, length) => {
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
      safeCore.string_list_drop.async(handle, (e) => {});
      resolve(list);
    };
    safeCore.string_list_len.async(handle, onResult);
  };
  return new Promise(executor);
};
