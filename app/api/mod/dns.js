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
      hasSafeDriveAccess: hasSafeDriveAccess,
      params: {
        longName: longName,
        serviceName: serviceName
      }
    };
    if (appDirKey) {
      msg.params.appDirKey = appDirKey;
    }
    this.send(msg, callback);
  }
}
