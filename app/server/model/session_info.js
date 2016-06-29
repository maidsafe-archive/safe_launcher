import crypto from 'crypto';

export default class SessionInfo {
  constructor(appId, appName, appVersion, vendor, permissions, appDirKey) {
    this.appId = appId;
    this.appName = appName;
    this.appVersion = appVersion;
    this.vendor = vendor;
    this.permissions = permissions || [];
    this.signingKey = crypto.randomBytes(32);
    this.appDirKey = appDirKey;
  }

  hasSafeDriveAccess() {
    return this.permissions.hasSafeDriveAccess();
  }
}
