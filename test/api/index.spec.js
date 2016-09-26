import { Application } from 'spectron';
import electronPath from 'electron';
import path from 'path';
import CONSTANTS from './constants';
import * as server from './server.spec';
import * as authorise from './authorise.spec';
import * as nfs from './nfs.spec';
import * as dns from './dns.spec';

const delay = time => new Promise(resolve => setTimeout(resolve, time));

describe('SAFE Launcher Test', function () {
  this.timeout(50000);

  const checkNetworkConnected = async() => {
    const { client } = this.app;
    await client.waitUntilWindowLoaded();
    await delay(1000);
    const networkStatus = await client.getAttribute('#networkStatus', 'class');
    console.warn(':: Network status :: ', networkStatus);
    if (networkStatus.indexOf('connected') === -1) {
      return await checkNetworkConnected();
    }
    try {
      await delay(1000);
      await client.click('button[name=settings_continue]');
    } catch (e) {
      console.error(e);
    }
  };

  const getRoute = async() => {
    const { client } = this.app;
    const url = await client.getUrl();
    return url.split('#')[1].split('?')[0].slice(1);
  };

  const register = async() => {
    const { client } = this.app;
    const route = await getRoute();
    console.warn(':: Current route :: ', route);
    if ((route === 'account') || (route === 'login')) {
      await client.click('.form-f-b a');
    }
    await delay(1000);
    await client.click('button[name=continue]');
    await delay(1000);
    await client.click('button[name=continue]');
    await delay(1000);
    await client.setValue('#accountSecret', CONSTANTS.USER_LOCATION);
    await client.setValue('#confirmAccountSecret', CONSTANTS.USER_LOCATION);
    await client.click('button[name=continue]');
    await delay(1000);
    await client.click('button[name=continue]');
    await delay(1000);
    await client.setValue('#accountPassword', CONSTANTS.USER_PASSWORD);
    await client.setValue('#confirmAccountPassword', CONSTANTS.USER_PASSWORD);
    await client.click('button[name=continue]');
  };

  const checkAuthenticated = async() => {
    const currentRoute = await getRoute();
    if (currentRoute !== 'account_app_list') {
      return await checkAuthenticated();
    }
    // TODO failed to login
  };

  const authoriseApp = async(status) => {
    const { client } = this.app;
    const authReqEle = (await client.element('.auth-req')).value;
    if (!authReqEle.ELEMENT) {
      return authoriseApp(true);
    }
    if (status) {
      return await client.click('button[name=allow]');
    }
    await client.click('button[name=deny]');
  };

  before(async() => {
    this.app = new Application({
      path: electronPath,
      args: [path.resolve(__dirname, '..', 'app')],
      startTimeout: 50000
    });
    await this.app.start();
    console.warn(':: Application started ::');
    await checkNetworkConnected();
    console.warn(':: Network connected ::');
    await register();
    console.warn(':: Registering with network ::');
    return await checkAuthenticated();
  });

  after(() => {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  describe('API Server Utils', () => {
    it('should connect to API server', server.checkHealth);
  });

  describe('Application Authorisation', () => {
    // Authorise application
    it('should authorise application', async() => {
      authoriseApp(true);
      await authorise.authoriseApp();
    });

    it('should deny authorisation', async() => {
      authoriseApp();
      await authorise.denyAuthorisation();
    });

    it('should be authorised application', authorise.checkAppAuthorised);
  });

  // NFS Directory
  describe('NFS Directory', () => {
    it('should be able to create directory', nfs.createDirTest);
    it('should not be able to create directory', nfs.createDirNegativeTest);
    it('should be able to get directory', nfs.getDirTest);
    it('should not be able to get directory', nfs.getDirNegativeTest);
    // getDirNegativeTest it('should be able to modify directory metadata', nfs.modifyDirTest);
    it('should be able to delete directory', nfs.deleteDirTest);
    it('should not be able to delete directory', nfs.deleteDirNegativeTest);
    it('should be able to move dirctory', nfs.moveDirTest);
    it('should be able to copy dirctory', nfs.copyDirTest);
  });

  describe('NFS File', () => {
    it('should be able to create file', nfs.createFileTest);
    it('should not be able to create file', nfs.createFileNegativeTest);
    it('should be able to get file', nfs.getFileTest);
    it('should not be able to get file', nfs.getFileNegativeTest);
    // it('should be able to modify file metadata', nfs.modifyAndGetFileMetaTest);
    it('should be able to delete file', nfs.deleteFileTest);
    it('should not be able to delete file', nfs.deleteFileNegativeTest);
    it('should be able to move file', nfs.moveFileTest);
    it('should be able to copy file', nfs.copyFileTest);
  });

  describe('DNS', () => {
    it('should be able to register DNS', dns.registerDnsTest);
    it('should not be able to register DNS', dns.registerDnsNegativeTest);
    it('should be able to create longname', dns.createLongNameTest);
    it('should not be able to create longname', dns.createLongNameNegativeTest);
    it('should be able to create and delete service name', dns.addAndDeleteServiceTest);
    it('should not be able to create service name', dns.addServiceNegativeTest);
    it('should not be able to delete service name', dns.deletServiceNegativeTest);
    it('should be able to get home directory', dns.getHomeDirectoryTest);
    // it('should be able to get files', dns.getFilesTest);
    it('should be able to get list of longnames', dns.getLongNamesTest);
    it('should be able to get list of service names', dns.listServiceNamesTest);
    it('should be able to delete longname', dns.deleteLongNameTest);
    it('should not be able to delete longname', dns.deleteLongNameNegativeTest);
  });

  // Revoke application
  describe('Revoke Application', () => {
    it('should revoke application', authorise.revokeApp);
  });
});
