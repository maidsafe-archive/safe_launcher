export default class DNS {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'dns';
  }

  getHomeDirectory(longName, serviceName, hasSafeDriveAccess, appDirKey, callback) {
    var msg = {
      module: this.MODULE,
      action: 'get-home-dir',
      isAuthorised: (appDirKey ? true : false),
      hasSafeDriveAccess: hasSafeDriveAccess || false,
      appDirKey: appDirKey,
      params: {
        longName: longName,
        serviceName: serviceName
      }
    };
    this.send(msg, callback);
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
}
