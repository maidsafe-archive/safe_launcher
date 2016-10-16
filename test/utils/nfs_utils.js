import Utils from './utils';
import { CONSTANTS } from '../constants';

class NFSUtils extends Utils {
	FILE_OR_DIR_ACTION = {
    COPY: 'copy',
    MOVE: 'move'
  };

	constructor() {
		super();
	}

	createDir(token, rootPath, path, body, config) {
    return this._sendNfsRequest(this.HTTP_METHOD.POST, false, token, rootPath, path, body, config);
  }

  getDir(token, rootPath, path, config) {
    return this._sendNfsRequest(this.HTTP_METHOD.GET, false, token, rootPath, path, config);
  }

  deleteDir(token, rootPath, path, config) {
    return this._sendNfsRequest(this.HTTP_METHOD.DELETE, false, token, rootPath, path, config, true);
  }

  modifyDir(token, rootPath, path, body, config) {
    return this._sendNfsRequest(this.HTTP_METHOD.PUT, false, token, rootPath, path, body, config);
  }

  moveOrCopyDir(token, srcRootPath, destRootPath, srcPath, destPath, action, config) {
    const url = 'nfs/movedir';
    const body = {
      srcPath,
      destPath,
      srcRootPath,
      destRootPath
    };
    if (action) {
      body.action = action;
    }
    return this.request(this.HTTP_METHOD.POST, url, token, body, config);
  }

  createFile(token, rootPath, path, body, config) {
    return this._sendNfsRequest(this.HTTP_METHOD.POST, true, token, rootPath, path, body, config);
  }

  getFile(token, rootPath, path, config) {
    return this._sendNfsRequest(this.HTTP_METHOD.GET, true, token, rootPath, path, config);
  }

  getFileMeta(token, rootPath, path, config) {
    return this._sendNfsRequest(this.HTTP_METHOD.HEAD, true, token, rootPath, path, config);
  }

  modifyFileMeta(token, rootPath, path, body, config) {
    const url = `${CONSTANTS.API.NFS_FILE}metadata/${rootPath || undefined}/${path || ''}`;
    return this.request(this.HTTP_METHOD.PUT, url, token, body, config);
  }

  moveOrCopyFile(token, srcRootPath, destRootPath, srcPath, destPath, action, config) {
    const url = 'nfs/movefile';
    const body = {
      srcPath,
      destPath,
      srcRootPath,
      destRootPath
    };
    if (action) {
      body.action = action;
    }
    return this.request(this.HTTP_METHOD.POST, url, token, body, config);
  }

  deleteFile(token, rootPath, path, config) {
    return this._sendNfsRequest(this.HTTP_METHOD.DELETE, true, token, rootPath, path, config);
  }

  _sendNfsRequest(method, isFile, ...arg) {
    const rootPath = arg[1];
    const dirPath = arg[2];
    const baseUrl = isFile ? CONSTANTS.API.NFS_FILE : CONSTANTS.API.NFS_DIR;
    const url = `${baseUrl}${rootPath || undefined}/${dirPath || ''}`;
    return this.request(method, url, arg[0], arg[3], arg[4]);
  }
}

const nfsUtils = new NFSUtils();

export default nfsUtils;