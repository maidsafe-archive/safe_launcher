export default class NFS {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'nfs';
  }

  createDirectory(dirPath, isPrivate, isVersioned, userMetadata, isPathShared,
    appDirKey, hasSafeDriveAccess, callback) {
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
              bytes: contentBytes
            }
          },
          isPathShared: isPathShared
        }
      };
      if (offset) {
        payload.params.newValues.content.offset = offset;
      }
      this.send(payload, callback);
    }
}
