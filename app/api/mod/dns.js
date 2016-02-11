export default class DNS {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'dns';
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
}
