export default class NFS {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'nfs';
  }

  createDirectory(dirPath, isPrivate, isVersioned, userMetadata, isPathShared, appDirKey, callback) {
    this.send({
      module: this.MODULE,
      action: 'create-dir',
      appDirKey: appDirKey,
      params: {
        dirPath: dirPath,
        isPrivate: isPrivate,
        userMetadata: userMetadata,
        isVersioned: isVersioned,
        isPathShared: isPathShared,
      }
    }, callback);
  }

}
