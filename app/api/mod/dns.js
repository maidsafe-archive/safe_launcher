export default class DNS {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'dns';
  }

  getHomeDirectory(longName, serviceName, hasSafeDriveAccess, appDirKey, callback) {
    this.send({
      module: this.MODULE,
      action: 'get-home-dir',
      isAuthorised: (appDirKey ? true : false),
      hasSafeDriveAccess: hasSafeDriveAccess || false,
      appDirKey: appDirKey,
      params: {
        longName: longName,
        serviceName: serviceName
      }
    }, callback);
  }

  register(longName, serviceName, serviceHomeDirPath, isPathShared,
    hasSafeDriveAccess, appDirKey, callback) {
    this.send({
      module: this.MODULE,
      action: 'register-dns',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: hasSafeDriveAccess,
      params: {
        longName: longName,
        serviceName: serviceName,
        isPathShared: isPathShared,
        serviceHomeDirPath: serviceHomeDirPath
      }
    }, callback);
  }

  addService(longName, serviceName, serviceHomeDirPath, isPathShared,
    hasSafeDriveAccess, appDirKey, callback) {
    this.send({
      module: this.MODULE,
      action: 'add-service',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: hasSafeDriveAccess,
      params: {
        longName: longName,
        serviceName: serviceName,
        isPathShared: isPathShared,
        serviceHomeDirPath: serviceHomeDirPath
      }
    }, callback);
  }

  getFile(longName, serviceName, filePath, offset, length, hasSafeDriveAccess, appDirKey, callback) {
    this.send({
      module: this.MODULE,
      action: 'get-file',
      isAuthorised: (appDirKey ? true : false),
      hasSafeDriveAccess: hasSafeDriveAccess || false,
      appDirKey: appDirKey,
      params: {
        longName: longName,
        serviceName: serviceName,
        offset: offset || 0,
        length: length || 0,
        filePath: filePath,
        includeMetadata: true
      }
    }, callback);
  }

  deleteDns(longName, hasSafeDriveAccess, appDirKey, callback) {
    this.send({
      module: this.MODULE,
      action: 'delete-dns',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: hasSafeDriveAccess,
      params: {
        longName: longName
      }
    }, callback);
  }

  deleteService(longName, serviceName, hasSafeDriveAccess, appDirKey, callback) {
    this.send({
      module: this.MODULE,
      action: 'delete-dns',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: hasSafeDriveAccess,
      params: {
        longName: longName,
        serviceName: serviceName
      }
    }, callback);
  }

  createPublicId(longName, callback) {
    this.send({
      module: this.MODULE,
      action: 'create-public-id',
      isAuthorised: true,
      appDirKey: null,
      hasSafeDriveAccess: false,
      params: {
        longName: longName
      }
    }, callback);
  }

  listLongNames(callback) {
    this.send({
      module: this.MODULE,
      action: 'get-long-names',
      isAuthorised: true,
      appDirKey: null,
      hasSafeDriveAccess: false,
      params: {
      }
    }, callback);
  }

  listServices(longName, callback) {
    this.send({
      module: this.MODULE,
      action: 'get-services',
      isAuthorised: true,
      appDirKey: null,
      hasSafeDriveAccess: false,
      params: {
        longName: longName
      }
    }, callback);
  }
}
