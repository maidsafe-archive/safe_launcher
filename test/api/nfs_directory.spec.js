import should from 'should';
import nfsUtils from '../utils/nfs_utils';
import authUtils from '../utils/auth_utils';
import { MESSAGES } from '../constants';

describe('NFS directory', () => {
  const utils = nfsUtils;
  let authToken = null;

  before(() => (
    authUtils.registerAndAuthorise()
      .then(token => (authToken = token))
  ));

  after(() => authUtils.revokeApp(authToken));

  describe('Create directory', () => {
    it('Should return 401 if invalid authorisation token', () => (
      utils.createDir(null, null, null, {})
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.UNAUTHORISED);
        })
    ));

    it('Should return 400 if rootPath is not found', () => (
      utils.createDir(authToken, null, null, {})
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('rootPath')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if directory path is null', () => (
      utils.createDir(authToken, 'app', null, {})
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.INVALID_DIR_PATH);
        })
    ));

    it('Should return 400 if directory path is \'/\'', () => (
      utils.createDir(authToken, 'app', '/', {})
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.INVALID_DIR_PATH);
        })
    ));
    it('Should return 400 if metadata on body is not a string', () => (
      utils.createDir(authToken, 'app', 'test', { metadata: true })
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('metadata')).be.not.equal(-1);
        })
    ));
    it('Should return 400 if isPrivate on body is not a boolean', () => (
      utils.createDir(authToken, 'app', 'test', { isPrivate: 'testStr' })
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('isPrivate')).be.not.equal(-1);
        })
    ));
    it('Should be able to create directory', () => {
      const dirPath = '/test_app';
      const rootPath = 'app';
      return utils.createDir(authToken, rootPath, dirPath, {})
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.ok();
        })
        .then(() => utils.deleteDir(authToken, rootPath, dirPath));
    });
    it('Should be able to create directory with metadata', () => {
      const dirPath = '/test_app';
      const rootPath = 'app';
      return utils.createDir(authToken, rootPath, dirPath, { metadata: 'this is test dir' })
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.ok();
        })
        .then(() => utils.deleteDir(authToken, rootPath, dirPath));
    });
    it('Should be able to create directory as private', () => {
      const dirPath = '/test_app';
      const rootPath = 'app';
      return utils.createDir(authToken, rootPath, dirPath, { isPrivate: true })
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.ok();
        })
        .then(() => utils.deleteDir(authToken, rootPath, dirPath));
    });
  });

  describe('Get directory', () => {
    const dirPath = 'test_app';
    const rootPath = 'app';

    before(() => utils.createDir(authToken, rootPath, dirPath, {}));

    after(() => utils.deleteDir(authToken, rootPath, dirPath));

    it('Should return 401 if invalid authorisation token', () => {
      return utils.getDir()
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.UNAUTHORISED);
        });
    });
    it('Should return 400 if rootPath is not found', () => {
      return utils.getDir(authToken, null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('rootPath')).be.not.equal(-1);
        });
    });
    it('Should return 404 if dir not found', () => (
    	utils.getDir(authToken, rootPath, 'unknown')
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(404))
  	));
    it('Should be able to get directory', () => {
      return utils.getDir(authToken, rootPath, dirPath)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('info', 'subDirectories', 'files');
          should(res.data.info).have.keys('name', 'metadata', 'isPrivate', 'isVersioned', 'createdOn', 'modifiedOn');
          should(res.data.info.name).be.equal(dirPath);
        });
    });
  });

  describe('Delete directory', () => {
    const dirPath = 'test_app';
    const rootPath = 'app';

    before(() => utils.createDir(authToken, rootPath, dirPath, {}));

    it('Should return 401 if invalid authorisation token', () => {
      return utils.deleteDir()
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.UNAUTHORISED);
        });
    });
    it('Should return 400 if rootPath is not found', () => {
      return utils.deleteDir(authToken, null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('rootPath')).be.not.equal(-1);
        });
    });
    it('Should return 400 when trying to delete root directory', () => {
      return utils.deleteDir(authToken, rootPath, '/')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.CANNOT_DELETE_ROOT);
        });
    });
    it('Should return 404 if dir not found', () => (
    	utils.deleteDir(authToken, rootPath, 'unknown')
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(404))
  	));
    it('Should be able to delete directory', () => {
      return utils.deleteDir(authToken, rootPath, dirPath)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
        });
    });
  });

  describe('Modify directory', () => {
    const dirPath = 'test_app';
    const rootPath = 'app';
    const newDirPath = 'test_new_app';

    before(() => utils.createDir(authToken, rootPath, dirPath, {}));

    after(() => utils.deleteDir(authToken, rootPath, dirPath));

    it('Should return 401 if invalid authorisation token', () => (
      utils.modifyDir()
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.UNAUTHORISED);
        })
    ));
    it('Should return 400 if rootPath is not found', () => {
      return utils.modifyDir(authToken, null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('rootPath')).be.not.equal(-1);
        });
    });
    it('Should return 400 if directory path is null', () => {
      return utils.modifyDir(authToken, rootPath, null, {})
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.INVALID_DIR_PATH);
        });
    });
    it('Should return 400 if directory path is \'/\'', () => {
      return utils.modifyDir(authToken, rootPath, '/', {})
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.INVALID_DIR_PATH);
        });
    });
    it('Should return 400 if metadata on body is not a string', () => {
      return utils.modifyDir(authToken, rootPath, dirPath, { metadata: true })
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('metadata')).be.not.equal(-1);
        });
    });
    it('Should return 400 if name on body is not a string', () => {
      return utils.modifyDir(authToken, rootPath, dirPath, { name: true })
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('name')).be.not.equal(-1);
        });
    });
    it('Should return 400 if either name or metadata are not found', () => {
      return utils.modifyDir(authToken, rootPath, dirPath, {})
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.REQUIRED_PARAMS_MISSING);
        });
    });
    it('Should return 404 if dir not found', () => (
    	utils.modifyDir(authToken, rootPath, 'unknown', { name: newDirPath })
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(404))
  	));
    it('Should be able to modify directory name', () => {
      return utils.modifyDir(authToken, rootPath, dirPath, { name: newDirPath })
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
        })
        .then(() => utils.getDir(authToken, rootPath, newDirPath))
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data.info.name).be.equal(newDirPath);
        })
        .then(() => utils.modifyDir(authToken, rootPath, newDirPath, { name: dirPath }));
    });
    it('Should be able to modify directory metadata', () => {
      const metadata = 'My test dir';
      return utils.modifyDir(authToken, rootPath, dirPath, { metadata: metadata })
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
        })
        .then(() => utils.getDir(authToken, rootPath, dirPath))
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data.info.metadata).be.equal(metadata);
        });
    });
  });

  describe('Move and copy directory', () => {
    const dirPath = 'test_app';
    const destDirPath = 'dest_test_app';
    const rootPath = 'app';

    before(() => (
      utils.createDir(authToken, rootPath, dirPath, {})
      .then(() => utils.createDir(authToken, rootPath, destDirPath, {}))
    ));

    after(() => (
      utils.deleteDir(authToken, rootPath, dirPath)
        .then(() => utils.deleteDir(authToken, rootPath, destDirPath))
    ));

    it('Should return 401 if invalid authorisation token', () => {
      return utils.moveOrCopyDir(null, null, null, {})
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.UNAUTHORISED);
        });
    });

    it('Should return 400 if srcRootPath is not found', () => {
      return utils.moveOrCopyDir(authToken, null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.REQUIRED_PARAMS_MISSING);
        });
    });

    it('Should return 400 if destRootPath is not found', () => {
      return utils.moveOrCopyDir(authToken, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.REQUIRED_PARAMS_MISSING);
        });
    });

    it('Should return 400 if srcPath is not found', () => {
      return utils.moveOrCopyDir(authToken, rootPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.REQUIRED_PARAMS_MISSING);
        });
    });

    it('Should return 400 if destPath is not found', () => {
      return utils.moveOrCopyDir(authToken, rootPath, rootPath, dirPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.REQUIRED_PARAMS_MISSING);
        });
    });

    it('Should return 400 if srcRootPath is not valid', () => {
      return utils.moveOrCopyDir(authToken, 'test', rootPath, dirPath, dirPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('srcRootPath')).be.not.equal(-1);
        });
    });

    it('Should return 400 if destRootPath is not valid', () => {
      return utils.moveOrCopyDir(authToken, rootPath, 'test', dirPath, dirPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('destRootPath')).be.not.equal(-1);
        });
    });

    it('Should return 400 if action is not valid', () => {
      return utils.moveOrCopyDir(authToken, rootPath, rootPath, dirPath, dirPath, 'test')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('action')).be.not.equal(-1);
        });
    });

    it('Should return 404 if source dir not found', () => (
    	utils.moveOrCopyDir(authToken, rootPath, rootPath, 'unknown', destDirPath)
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(404))
  	));

  	it('Should return 404 if destination dir not found', () => (
    	utils.moveOrCopyDir(authToken, rootPath, rootPath, dirPath, 'unknown')
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(404))
  	));

    it('Should be able to move directory', () => {
      return utils.moveOrCopyDir(authToken, rootPath, rootPath, dirPath, destDirPath, utils.FILE_OR_DIR_ACTION.MOVE)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
        })
        .then(() => utils.getDir(authToken, rootPath, destDirPath))
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data.subDirectories[0].name).be.equal(dirPath);
        })
        .then(() => utils.moveOrCopyDir(authToken, rootPath, rootPath, `${destDirPath}/${dirPath}`, '/', utils.FILE_OR_DIR_ACTION.MOVE));
    });

    it('Should be able to move directory by default', () => {
      return utils.moveOrCopyDir(authToken, rootPath, rootPath, dirPath, destDirPath)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
        })
        .then(() => utils.getDir(authToken, rootPath, destDirPath))
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data.subDirectories[0].name).be.equal(dirPath);
        })
        .then(() => utils.moveOrCopyDir(authToken, rootPath, rootPath, `${destDirPath}/${dirPath}`, '/', utils.FILE_OR_DIR_ACTION.MOVE));
    });

    it('Should be able to copy directory', () => {
      return utils.moveOrCopyDir(authToken, rootPath, rootPath, dirPath, destDirPath, utils.FILE_OR_DIR_ACTION.COPY)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
        })
        .then(() => utils.getDir(authToken, rootPath, destDirPath))
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data.subDirectories[0].name).be.equal(dirPath);
        })
        .then(() => utils.getDir(authToken, rootPath, dirPath))
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data.info.name).be.equal(dirPath);
          });
    });
  });
});
