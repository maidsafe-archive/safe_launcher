'use strict';

export default class App {

  constructor(appName, appId, vendorName, version, permission) {
    if (!appId || !appName || !vendorName || !version) {
      throw new Error('Fields can not be empty');
    }
    this._appName = appName;
    this._appId = appId;
    this._version = version;
    this._vendorName = vendorName;
    this._permission = permission;
  }

  get name() {
    return this._appName;
  }

  get id() {
    return this._appId;
  }

  get version() {
    return this._version;
  }

  get vendor() {
    return this._vendorName;
  }

  get permission() {
    return this._permission;
  }

}
