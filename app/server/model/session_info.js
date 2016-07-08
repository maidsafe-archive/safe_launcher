import crypto from 'crypto';

export default class SessionInfo {
  constructor(appId, appName, appVersion, vendor, permissions, appDirKey) {
    this['appIdentifier'] = appId;
    this['appDisplayName'] = appName;
    this['version'] = appVersion;
    this['appVendor'] = vendor;
    this['appPermissions'] = permissions || [];
    this['appSigningKey'] = crypto.randomBytes(32);
    this['appRootDirKey'] = appDirKey;
    this['activities'] = [];
  }

  addActivity(activity) {
    this['activities'].push(activity);
    this['activities'] = this['activities'].slice(0, 500)
  }

  updateActivity(activity) {
    let index = this['activities'].indexOf(activity);
    if (index < 0) {
      return;
    }
    this['activities'][index] = activity;
  }

  hasSafeDriveAccess() {
    return this.permissions.hasSafeDriveAccess();
  }

  get appId() {
    return this['appIdentifier'];
  }

  get appName() {
    return this['appDisplayName'];
  }

  get appVersion() {
    return this['version'];
  }

  get vendor() {
    return this['appVendor'];
  }

  get permissions() {
    return this['appPermissions'];
  }

  get signingKey() {
    return this['appSigningKey'];
  }

  get appDirKey() {
    return this['appRootDirKey'];
  }
}
