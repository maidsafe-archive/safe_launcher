import crypto from 'crypto';
export default class SessionInfo {
  constructor(app) {
    this.appSigningKey = crypto.randomBytes(32);
    this.ffiApp = app;
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

  get appId() {
    return this.ffiApp.id;
  }

  get appName() {
    return this.ffiApp.name;
  }

  get appVersion() {
    return this.ffiApp.version;
  }

  get vendor() {
    return this.ffiApp.vendor;
  }

  get permissions() {
    return this.ffiApp.permission;
  }

  get signingKey() {
    return this.appSigningKey;
  }

  get app() {
    return this.ffiApp;
  }
}
