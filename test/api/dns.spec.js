import should from 'should';
import dnsUtils from '../utils/dns_utils';
import nfsUtils from '../utils/nfs_utils';
import authUtils from '../utils/auth_utils';
import { MESSAGES } from '../constants';

describe('DNS', () => {
	let authToken = null;
  const dirPath = 'test_app';
  const rootPath = 'app';
  const longName = 'testdns';
  const serviceName = 'www';

  before(() => (
    authUtils.registerAndAuthorise()
    .then(token => (authToken = token))
    .then(() => nfsUtils.createDir(authToken, rootPath, dirPath))
  ));

  after(() => (
    nfsUtils.deleteDir(authToken, rootPath, dirPath)
      .then(() => authUtils.revokeApp(authToken))
  ));

  describe('Register long name and service', () => {
  	after(() => (
  		dnsUtils.deleteServiceName(authToken, longName, serviceName)
  			.then(() => dnsUtils.deleteDns(authToken, longName))
		));

  	it('Should return 401 if invalid authorisation token', () => (
      dnsUtils.register()
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          // should(err.response.data.errorCode).be.equal(400);
          // should(err.response.data.description).be.equal(MESSAGES.UNAUTHORISED);
        })
    ));

    it('Should return 400 if longName not found', () => (
      dnsUtils.register(authToken)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName not found', () => (
      dnsUtils.register(authToken, longName)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceHomeDirPath not found', () => (
      dnsUtils.register(authToken, longName, serviceName)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceHomeDirPath')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if rootPath not found', () => (
      dnsUtils.register(authToken, longName, serviceName, dirPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('rootPath')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains Capitalcase', () => (
      dnsUtils.register(authToken, 'testCase', serviceName, dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains underscore', () => (
      dnsUtils.register(authToken, 'test_case', serviceName, dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains space', () => (
      dnsUtils.register(authToken, 'test case', serviceName, dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains more than 63 characters', () => (
      dnsUtils.register(authToken, 'fa159afeea08a801cbf0fe6ac79050d015efe76e5a9fc9f34a12d42f7b8bb7r', serviceName, dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName contains Capitalcase', () => (
      dnsUtils.register(authToken, longName, 'testCase', dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName contains underscore', () => (
      dnsUtils.register(authToken, longName, 'test_case', dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName contains space', () => (
      dnsUtils.register(authToken, longName, 'test case', dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName contains more than 63 characters', () => (
      dnsUtils.register(authToken, longName, 'fa159afeea08a801cbf0fe6ac79050d015efe76e5a9fc9f34a12d42f7b8bb7r', dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if rootPath is not valid', () => (
      dnsUtils.register(authToken, longName, serviceName, dirPath, 'rootPath')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('rootPath')).be.not.equal(-1);
        })
    ));

    // it('Should return 404 if serviceHomeDirPath is not found', () => (
    //   dnsUtils.register(authToken, longName, serviceName, 'dirPath', rootPath)
    //     .should.be.rejectedWith(Error)
    //     .then(err => should(err.response.status).be.equal(404))
    // ));

    it('Should be able to register', () => (
    	dnsUtils.register(authToken, longName, serviceName, dirPath, rootPath)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
  	));
  });

	describe('Create public id', () => {
		after(() => dnsUtils.deleteDns(authToken, longName));

		it('Should return 401 if invalid authorisation token', () => (
      dnsUtils.createPublicId()
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(401))
    ));

    it('Should return 400 if longName contains Capitalcase', () => (
      dnsUtils.createPublicId(authToken, 'testCase')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains underscore', () => (
      dnsUtils.createPublicId(authToken, 'test_case')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains space', () => (
      dnsUtils.createPublicId(authToken, 'test case')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains more than 63 characters', () => (
      dnsUtils.createPublicId(authToken, 'fa159afeea08a801cbf0fe6ac79050d015efe76e5a9fc9f34a12d42f7b8bb7r')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should be able to create public id', () => (
    	dnsUtils.createPublicId(authToken, longName)
    		.should.be.fulfilled()
    		.then(res => should(res.status).be.equal(200))
  	));

  	it('Should return 400 if public id already exist', () => (
    	dnsUtils.createPublicId(authToken, longName)
    		.should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1001);
          should(err.response.data.description).be.equal('DnsError::DnsNameAlreadyRegistered');
        })
  	));
	});	

	describe('Add service', () => {
		before(() => dnsUtils.createPublicId(authToken, longName));

		after(() => (
  		dnsUtils.deleteServiceName(authToken, longName, serviceName)
  			.then(() => dnsUtils.deleteDns(authToken, longName))
		));

		it('Should return 401 if invalid authorisation token', () => (
      dnsUtils.addService()
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(401))
    ));

    it('Should return 400 if longName not found', () => (
      dnsUtils.addService(authToken)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName not found', () => (
      dnsUtils.addService(authToken, longName)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceHomeDirPath not found', () => (
      dnsUtils.addService(authToken, longName, serviceName)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceHomeDirPath')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if rootPath not found', () => (
      dnsUtils.addService(authToken, longName, serviceName, dirPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('rootPath')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains Capitalcase', () => (
      dnsUtils.register(authToken, 'testCase', serviceName, dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains underscore', () => (
      dnsUtils.register(authToken, 'test_case', serviceName, dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains space', () => (
      dnsUtils.register(authToken, 'test case', serviceName, dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if longName contains more than 63 characters', () => (
      dnsUtils.register(authToken, 'fa159afeea08a801cbf0fe6ac79050d015efe76e5a9fc9f34a12d42f7b8bb7r', serviceName, dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('longName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName contains Capitalcase', () => (
      dnsUtils.addService(authToken, longName, 'testCase', dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName contains underscore', () => (
      dnsUtils.addService(authToken, longName, 'test_case', dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName contains space', () => (
      dnsUtils.addService(authToken, longName, 'test case', dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if serviceName contains more than 63 characters', () => (
      dnsUtils.addService(authToken, longName, 'fa159afeea08a801cbf0fe6ac79050d015efe76e5a9fc9f34a12d42f7b8bb7r', dirPath, rootPath)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('serviceName')).be.not.equal(-1);
        })
    ));

    it('Should be able to add service', () => (
    	dnsUtils.addService(authToken, longName, serviceName, dirPath, rootPath)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
  	));
	});

	describe('Delete service name', () => {
		before(() => (
			dnsUtils.createPublicId(authToken, longName)
				.then(() => dnsUtils.addService(authToken, longName, serviceName, dirPath, rootPath))
		));

		after(() => dnsUtils.deleteDns(authToken, longName));

		it('Should return 401 if invalid authorisation token', () => (
      dnsUtils.deleteServiceName()
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(401))
    ));

    it('Should return 404 if longName doesn\'t exist', () => (
      dnsUtils.deleteServiceName(authToken, 'longName', serviceName)
        .should.be.rejectedWith(Error)
        .then(err => {
        	should(err.response.status).be.equal(404)
        	should(err.response.data.errorCode).be.equal(-1002)
        	should(err.response.data.description).be.equal('DnsError::DnsRecordNotFound')
        })
    ));

    it('Should return 404 if serviceName doesn\'t exist', () => (
      dnsUtils.deleteServiceName(authToken, longName, 'servicename')
        .should.be.rejectedWith(Error)
        .then(err => {
        	should(err.response.status).be.equal(404)
        	should(err.response.data.errorCode).be.equal(-1004)
        	should(err.response.data.description).be.equal('DnsError::ServiceNotFound')
        })
    ));

    it('Should be able to delete serviceName', () => (
      dnsUtils.deleteServiceName(authToken, longName, serviceName)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
    ));
	});

	describe('Delete public name', () => {
		before(() => dnsUtils.createPublicId(authToken, longName));

		it('Should return 401 if invalid authorisation token', () => (
      dnsUtils.deleteDns()
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(401))
    ));

    it('Should return 404 if public name doesn\'t exist', () => (
      dnsUtils.deleteDns(authToken, 'longName')
        .should.be.rejectedWith(Error)
        .then(err => {
        	should(err.response.status).be.equal(404)
        	should(err.response.data.errorCode).be.equal(-1002)
        	should(err.response.data.description).be.equal('DnsError::DnsRecordNotFound')
        })
    ));

    it('Should be able to delete public id', () => (
      dnsUtils.deleteDns(authToken, longName)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
    ));
	});

	describe('Get public names', () => {
		before(() => dnsUtils.createPublicId(authToken, longName));

		after(() => dnsUtils.deleteDns(authToken, longName));

		it('Should return 401 if invalid authorisation token', () => (
      dnsUtils.listLongNames()
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(401))
    ));

		it('Should be able to get list of public ids', () => (
			dnsUtils.listLongNames(authToken)
        .should.be.fulfilled()
        .then(res => {
        	should(res.status).be.equal(200)
        	should(res.data).containEql(longName);
        })
		));
	});

	describe('Get service names', () => {
		before(() => (
			dnsUtils.createPublicId(authToken, longName)
				.then(() => dnsUtils.addService(authToken, longName, serviceName, dirPath, rootPath))
		));

		after(() => (
  		dnsUtils.deleteServiceName(authToken, longName, serviceName)
  			.then(() => dnsUtils.deleteDns(authToken, longName))
		));

		it('Should return 401 if invalid authorisation token', () => (
      dnsUtils.listServiceNames()
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(401))
    ));

     it.skip('Should return 404 if longName doesn\'t exist', () => (
      dnsUtils.listServiceNames(authToken, 'longName', serviceName)
        .should.be.rejectedWith(Error)
        .then(err => {
        	should(err.response.status).be.equal(404)
        	should(err.response.data.errorCode).be.equal(-1002)
        	should(err.response.data.description).be.equal('DnsError::DnsRecordNotFound')
        })
    ));

		it('Should be able to get list of service names', () => (
			dnsUtils.listServiceNames(authToken, longName)
        .should.be.fulfilled()
        .then(res => {
        	should(res.status).be.equal(200)
        	should(res.data).containEql(serviceName);
        })
		));
	});

	describe('Get home directory', () => {
		before(() => (
			dnsUtils.createPublicId(authToken, longName)
				.then(() => dnsUtils.addService(authToken, longName, serviceName, dirPath, rootPath))
		));

		after(() => (
  		dnsUtils.deleteServiceName(authToken, longName, serviceName)
  			.then(() => dnsUtils.deleteDns(authToken, longName))
		));

    it.skip('Should return 404 if longName doesn\'t exist', () => (
      dnsUtils.getHomeDir(authToken, 'longName', serviceName)
        .should.be.rejectedWith(Error)
        .then(err => {
        	should(err.response.status).be.equal(404)
        	should(err.response.data.errorCode).be.equal(-1002)
        	should(err.response.data.description).be.equal('DnsError::DnsRecordNotFound')
        })
    ));

    it('Should return 404 if serviceName doesn\'t exist', () => (
      dnsUtils.getHomeDir(authToken, longName, 'servicename')
        .should.be.rejectedWith(Error)
        .then(err => {
        	should(err.response.status).be.equal(404)
        	should(err.response.data.errorCode).be.equal(-1004)
        	should(err.response.data.description).be.equal('DnsError::ServiceNotFound')
        })
    ));

    it('Should be able to get home directory as unauthorised user', () => {
    	dnsUtils.getHomeDir(null, longName, serviceName)
        .should.be.fulfilled()
        .then(res => {
        	should(res.status).be.equal(200);
        	should(res.data).have.keys('info', 'subDirectories', 'files');
          should(res.data.info).have.keys('name', 'metadata', 'isPrivate', 'isVersioned', 'createdOn', 'modifiedOn');
          should(res.data.info.name).be.equal(dirPath);
        })
    });

    it('Should be able to get home directory as authorised user', () => {
    	dnsUtils.getHomeDir(authToken, longName, serviceName)
        .should.be.fulfilled()
        .then(res => {
        	should(res.status).be.equal(200);
        	should(res.data).have.keys('info', 'subDirectories', 'files');
          should(res.data.info).have.keys('name', 'metadata', 'isPrivate', 'isVersioned', 'createdOn', 'modifiedOn');
          should(res.data.info.name).be.equal(dirPath);
        })
    });
	});

	describe('Get files', () => {
		const fileName = 'test_file.txt';
		const filePath = `${dirPath}/${fileName}`;
		const fileContent = 'this is test file';

		before(() => (
			dnsUtils.createPublicId(authToken, longName)
				.then(() => dnsUtils.addService(authToken, longName, serviceName, dirPath, rootPath))
				.then(() => nfsUtils.createFile(authToken, rootPath, filePath, fileContent, { headers: { 'content-type': 'text/plain' } }))
		));

		after(() => (
			nfsUtils.deleteFile(authToken, rootPath, filePath)
  			.then(() => dnsUtils.deleteServiceName(authToken, longName, serviceName))
  			.then(() => dnsUtils.deleteDns(authToken, longName))
		));

		it('Should return 400 if range is not in bytes', () => {
			dnsUtils.getFile(authToken, longName, serviceName, filePath, { headers: { range: 'data=' } })
				.should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('range')).be.not.equal(-1);
        })
		});

		it.skip('Should return 404 if file doesn\'t exist', () => {
			dnsUtils.getFile(authToken, longName, serviceName, 'testFile.txt')
				.should.be.rejectedWith(Error)
				.then(err => {
					should(err.response.status).be.equal(404);
				})
		})

		it('Should be able to get file', () => {
			dnsUtils.getFile(authToken, longName, serviceName, filePath)
				.should.be.fulfilled()
				.then(res => {
					should(res.status).be.equal(200);
					should(res.data).be.equal(fileContent);
				})
		});
	});
});
