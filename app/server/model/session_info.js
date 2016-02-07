import * as sodium from 'libsodium-wrappers';

export default class SessionInfo {
  constructor(appId, appName, appVersion, vendor, permissions, appDirKey) {
    this.appId = appId;
    this.appName = appName;
    this.appVersion = appVersion;
    this.vendor = vendor;
    this.permissions = permissions || [];
    this.secretKey = sodium.randombytes_buf(sodium.crypto_box_SECRETKEYBYTES);
    this.signingKey = sodium.randombytes_buf(sodium.crypto_box_SECRETKEYBYTES);
    this.appDirKey = appDirKey;
  }
}
