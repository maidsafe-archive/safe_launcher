import { log } from './../../logger/log';

export default class NFS {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'nfs';
  }

  createDirectory(dirPath, isPrivate, isVersioned, userMetadata, isPathShared,
    hasSafeDriveAccess, appDirKey, callback) {
    log.debug('Invoking API NFS::createDirectory - FFI::' + this.MODULE + '::create-dir');
    this.send({
      module: this.MODULE,
      action: 'create-dir',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: hasSafeDriveAccess,
      params: {
        dirPath: dirPath,
        isPrivate: isPrivate,
        userMetadata: userMetadata,
        isVersioned: isVersioned,
        isPathShared: isPathShared
      }
    }, callback);
  }

  getDirectory(dirPath, isPathShared, hasSafeDriveAccess, appDirKey, callback) {
    log.debug('Invoking API NFS::getDirectory - FFI::' + this.MODULE + '::get-dir');
    this.send({
      module: this.MODULE,
      action: 'get-dir',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: hasSafeDriveAccess,
      params: {
        dirPath: dirPath,
        isPathShared: isPathShared
      }
    }, callback);
  }

  deleteDirectory(dirPath, isPathShared, hasSafeDriveAccess, appDirKey, callback) {
      log.debug('Invoking API NFS::deleteDirectory - FFI::' + this.MODULE + '::delete-dir');
      this.send({
        module: this.MODULE,
        action: 'delete-dir',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          dirPath: dirPath,
          isPathShared: isPathShared
        }
      }, callback);
    }

    modifyDirectory(name, userMetadata, dirPath, isPathShared, appDirKey, hasSafeDriveAccess, callback) {
      log.debug('Invoking API NFS::modifyDirectory - FFI::' + this.MODULE + '::modify-dir');
      var payload = {
        module: this.MODULE,
        action: 'modify-dir',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          dirPath: dirPath,
          newValues: {},
          isPathShared: isPathShared
        }
      };
      if (typeof name === 'string' && name) {
        payload.params.newValues.name = name;
      }
      if (typeof userMetadata === 'string') {
        payload.params.newValues.userMetadata = userMetadata;
      }
      this.send(payload, callback);
    }

    createFile(filePath, userMetadata, isPathShared, appDirKey, hasSafeDriveAccess, callback) {
      log.debug('Invoking API NFS::createFile - FFI::' + this.MODULE + '::create-file');
      this.send({
        module: this.MODULE,
        action: 'create-file',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          filePath: filePath,
          userMetadata: userMetadata,
          isPathShared: isPathShared
        }
      }, callback);
    }

    deleteFile(filePath, isPathShared, appDirKey, hasSafeDriveAccess, callback) {
      log.debug('Invoking API NFS::deleteFile - FFI::' + this.MODULE + '::delete-file');
      this.send({
        module: this.MODULE,
        action: 'delete-file',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          filePath: filePath,
          isPathShared: isPathShared
        }
      }, callback);
    }

    modifyFileMeta(name, userMetadata, filePath, isPathShared, appDirKey, hasSafeDriveAccess, callback) {
      log.debug('Invoking API NFS::modifyFileMeta - FFI::' + this.MODULE + '::modify-file-meta');
      var payload = {
        module: this.MODULE,
        action: 'modify-file-meta',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          filePath: filePath,
          newValues: {},
          isPathShared: isPathShared
        }
      };
      if (typeof name === 'string' && name) {
        payload.params.newValues.name = name;
      }
      if (typeof userMetadata === 'string') {
        payload.params.newValues.userMetadata = userMetadata;
      }
      this.send(payload, callback);
    }

    modifyFileContent(contentBytes, offset, filePath, isPathShared, appDirKey, hasSafeDriveAccess, callback) {
      log.debug('Invoking API NFS::modifyFileContent - FFI::' + this.MODULE + '::modify-file-content');
      var payload = {
        module: this.MODULE,
        action: 'modify-file-content',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          filePath: filePath,
          newValues: {
            content: {
              bytes: contentBytes,
              offset: offset
            }
          },
          isPathShared: isPathShared
        }
      };
      this.send(payload, callback);
    }

    getFile(filePath, isPathShared, offset, length, hasSafeDriveAccess, appDirKey, callback) {
      log.debug('Invoking API NFS::getFile - FFI::' + this.MODULE + '::get-file');
      this.send({
        module: this.MODULE,
        action: 'get-file',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          filePath: filePath,
          isPathShared: isPathShared,
          offset: offset || 0,
          length: length || 0,
          includeMetadata: true
        }
      }, callback);
    }

    getFileMetadata(filePath, isPathShared, hasSafeDriveAccess, appDirKey, callback) {
      log.debug('Invoking API NFS::getFileMetadata - FFI::' + this.MODULE + '::get-file');
      this.send({
        module: this.MODULE,
        action: 'get-file-metadata',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          filePath: filePath,
          isPathShared: isPathShared
        }
      }, callback);
    }

    moveDir(srcPath, isSrcPathShared, destPath, isDestPathShared, retainSource,
      hasSafeDriveAccess, appDirKey, callback) {
      this.send({
        module: this.MODULE,
        action: 'move-dir',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          srcPath: srcPath,
          isSrcPathShared: isSrcPathShared,
          destPath: destPath,
          isDestPathShared: isDestPathShared,
          retainSource: retainSource
        }
      }, callback);
    }

    moveFile(srcPath, isSrcPathShared, destPath, isDestPathShared, retainSource,
      hasSafeDriveAccess, appDirKey, callback) {
      this.send({
        module: this.MODULE,
        action: 'move-file',
        isAuthorised: true,
        appDirKey: appDirKey,
        hasSafeDriveAccess: hasSafeDriveAccess,
        params: {
          srcPath: srcPath,
          isSrcPathShared: isSrcPathShared,
          destPath: destPath,
          isDestPathShared: isDestPathShared,
          retainSource: retainSource
        }
      }, callback);
    }
}
