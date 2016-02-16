import * as sodium from 'libsodium-wrappers';

export default class SessionInfo {
  constructor(appId, appName, appVersion, vendor, permissions, appDirKey) {
    this.appId = appId;
    this.appName = appName;
    this.appVersion = appVersion;
    this.vendor = vendor;
    this.permissions = permissions || [];
    this.nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    this.secretKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
    this.signingKey = sodium.randombytes_buf(sodium.crypto_box_SECRETKEYBYTES);
    this.appDirKey = appDirKey;
  }

  hasSafeDriveAccess() {
    return this.permissions.hasSafeDriveAccess();
  }

  encryptResponse(jsonObj) {
    var responseBody = JSON.stringify(jsonObj);
    return new Buffer(sodium.crypto_secretbox_easy(responseBody, this.nonce, this.secretKey)).toString('base64');
  }

  encryptBuffer(buffer) {
    return new Buffer(sodium.crypto_secretbox_easy(buffer, this.nonce, this.secretKey))
  }

}
