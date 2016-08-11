import crypto from 'crypto';
export default class SessionInfo {
  constructor(appId, appName, appVersion, vendor, permissions, appDirKey) {
    this.appIdentifier = appId;
    this.appDisplayName = appName;
    this.version = appVersion;
    this.appVendor = vendor;
    this.appPermissions = permissions || [];
    this.appSigningKey = crypto.randomBytes(32);
    this.appRootDirKey = appDirKey;
    this.activities = [];
  }

  addActivity(activity) {
    if (this.activities.length < 500) {
      this.activities.push(activity);
    } else {
      this.activities.splice(this.activities.length - 1, 0, activity);
      this.activities.pop();
    }
  }

  updateActivity(activity) {
    let index = this.activities.indexOf(activity);
    if (index < 0) {
      return;
    }
    this.activities[index] = activity;
  }

  get activityList() {
    return this.activities;
  }

  hasSafeDriveAccess() {
    return this.permissions.hasSafeDriveAccess();
  }

  get appId() {
    return this.appIdentifier;
  }

  get appName() {
    return this.appDisplayName;
  }

  get appVersion() {
    return this.version;
  }

  get vendor() {
    return this.appVendor;
  }

  get permissions() {
    return this.appPermissions;
  }

  get signingKey() {
    return this.appSigningKey;
  }

  get appDirKey() {
    return this.appRootDirKey;
  }
}
