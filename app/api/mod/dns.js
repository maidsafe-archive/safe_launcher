import { log } from './../../logger/log';

export default class DNS {

  constructor(msgSender) {
    this.send = msgSender;
    this.MODULE = 'dns';
  }

  getHomeDirectory(longName, serviceName, hasSafeDriveAccess, appDirKey, callback) {
    log.debug('Invoking API DNS::getHomeDirectory - FFI::' + this.MODULE + '::get-home-dir');
    this.send({
      module: this.MODULE,
      action: 'get-home-dir',
      isAuthorised: (appDirKey ? true : false),
      hasSafeDriveAccess: hasSafeDriveAccess || false,
      appDirKey: appDirKey,
      params: {
        longName: longName,
        serviceName: serviceName
      }
    }, callback);
  }

  register(longName, serviceName, serviceHomeDirPath, isPathShared,
    hasSafeDriveAccess, appDirKey, callback) {
    log.debug('Invoking API DNS::register - FFI::' + this.MODULE + '::register-dns');
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
    log.debug('Invoking API DNS::addService - FFI::' + this.MODULE + '::add-service');
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

  getFile(longName, serviceName, filePath, offset, length, hasSafeDriveAccess, appDirKey, callback) {
    log.debug('Invoking API DNS::getFile - FFI::' + this.MODULE + '::get-file');
    this.send({
      module: this.MODULE,
      action: 'get-file',
      isAuthorised: (appDirKey ? true : false),
      hasSafeDriveAccess: hasSafeDriveAccess || false,
      appDirKey: appDirKey,
      params: {
        longName: longName,
        serviceName: serviceName,
        offset: offset || 0,
        length: length || 0,
        filePath: filePath,
        includeMetadata: true
      }
    }, callback);
  }

  getFileMetadata(longName, serviceName, filePath, hasSafeDriveAccess, appDirKey, callback) {
    log.debug('Invoking API DNS::getFile - FFI::' + this.MODULE + '::get-file');
    this.send({
      module: this.MODULE,
      action: 'get-file-metadata',
      isAuthorised: (appDirKey ? true : false),
      hasSafeDriveAccess: hasSafeDriveAccess || false,
      appDirKey: appDirKey,
      params: {
        longName: longName,
        serviceName: serviceName,
        filePath: filePath
      }
    }, callback);
  }

  deleteDns(longName, hasSafeDriveAccess, appDirKey, callback) {
    log.debug('Invoking API DNS::deleteDns - FFI::' + this.MODULE + '::delete-dns');
    this.send({
      module: this.MODULE,
      action: 'delete-dns',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: hasSafeDriveAccess,
      params: {
        longName: longName
      }
    }, callback);
  }

  deleteService(longName, serviceName, hasSafeDriveAccess, appDirKey, callback) {
    log.debug('Invoking API DNS::deleteService - FFI::' + this.MODULE + '::delete-dns');
    this.send({
      module: this.MODULE,
      action: 'delete-service',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: hasSafeDriveAccess,
      params: {
        longName: longName,
        serviceName: serviceName
      }
    }, callback);
  }

  createPublicId(longName, appDirKey, callback) {
    log.debug('Invoking API DNS::createPublicId - FFI::' + this.MODULE + '::register-public-id');
    this.send({
      module: this.MODULE,
      action: 'register-public-id',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: false,
      params: {
        longName: longName
      }
    }, callback);
  }

  listLongNames(appDirKey, callback) {
    log.debug('Invoking API DNS::listLongNames - FFI::' + this.MODULE + '::get-long-names');
    this.send({
      module: this.MODULE,
      action: 'get-long-names',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: false,
      params: {
      }
    }, callback);
  }

  listServices(longName, appDirKey, callback) {
    log.debug('Invoking API DNS::listServices - FFI::' + this.MODULE + '::get-services');
    this.send({
      module: this.MODULE,
      action: 'get-services',
      isAuthorised: true,
      appDirKey: appDirKey,
      hasSafeDriveAccess: false,
      params: {
        longName: longName
      }
    }, callback);
  }
}
