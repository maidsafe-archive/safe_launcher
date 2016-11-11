import should from 'should';
import crypto from 'crypto';
import structUtils from '../utils/structured_data_utils';
import dataIdUtils from '../utils/data_id_utils';
import authUtils from '../utils/auth_utils';
import { CONSTANTS, MESSAGES } from '../constants';

describe('Structured data', () => {
  let authToken = null;
  let sdHandleId = null;
  const invalidHandleId = 1234;
  const TYPE_TAG = CONSTANTS.TYPE_TAG.UNVERSIONED;
  const SD_CONTENT = new Buffer('test structured data').toString('base64');

  const createSD = name => (
    structUtils.create(authToken, name, TYPE_TAG, null, SD_CONTENT)
      .then(res => (sdHandleId = res.data.handleId))
      .then(() => structUtils.put(authToken, sdHandleId))
      .then(() => structUtils.dropHandle(authToken, sdHandleId))
      .then(() => dataIdUtils.getDataIdForStructuredData(authToken, name, TYPE_TAG))
      .then(res => structUtils.getHandle(authToken, res.data.handleId))
      .then(res => (sdHandleId = res.data.handleId))
  );

  before(() => (
    authUtils.registerAndAuthorise(CONSTANTS.AUTH_PAYLOAD_LOW_LEVEL_API)
      .then(token => (authToken = token))
  ));
  after(() => authUtils.revokeApp(authToken));

  describe('Create and read structure data', () => {
    const SD_NAME = crypto.randomBytes(32).toString('base64');

    after(() => (
      structUtils.delete(authToken, sdHandleId)
        .then(() => structUtils.dropHandle(authToken, sdHandleId))
    ));

    it('Should return 401 if authorisation token is not valid', () => (
      structUtils.create(null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 403 if low Level API Access is not provided', () => {
      let authTokenWithoutAccess = null;
      return authUtils.registerAndAuthorise()
        .then(token => (authTokenWithoutAccess = token))
        .then(() => structUtils.create(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should return 400 if \'name\' params is missing on creation', () => (
      structUtils.create(authToken)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('name')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if typeTag is not a number on creation', () => (
      structUtils.create(authToken, SD_NAME, 'typeTag')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('Tag type')).be.not.equal(-1);
        })
    ));

    it('Should return 400 if typeTag is not in specific range on creation', () => (
      structUtils.create(authToken, SD_NAME, 14999)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal('Invalid tag type specified');
        })
    ));

    it('Should return 400 if data is not base64 buffer on creation', () => (
      structUtils.create(authToken, SD_NAME, TYPE_TAG, null, 11)
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(400))
    ));

    it('Should return 400 if cipherOptsHandle is not valid on creation', () => (
      structUtils.create(authToken, SD_NAME, TYPE_TAG, 11, 'test string')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1517);
          should(err.response.data.description).be.equal('FfiError::InvalidCipherOptHandle');
        })
    ));

    it('Should return 401 if authorisation token is not valid on put', () => (
      structUtils.put(null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 400 if invalid handleId is passed on put', () => (
      structUtils.put(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1513);
          should(err.response.data.description).be.equal('FfiError::InvalidStructDataHandle');
        })
    ));

    it('Should return 400 if invalid handleId is passed on read', () => (
      structUtils.read(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1513);
          should(err.response.data.description).be.equal('FfiError::InvalidStructDataHandle');
        })
    ));

    it('Should return 400 if invalid handleId is passed on get metadata', () => (
      structUtils.getMetadata(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1513);
          should(err.response.data.description).be.equal('FfiError::InvalidStructDataHandle');
        })
    ));

    it('Should return 404 if data not found', () => (
      structUtils.create(authToken, SD_NAME, TYPE_TAG, null, SD_CONTENT)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(isNaN(res.data.handleId)).not.be.ok();
          sdHandleId = res.data.handleId;
        })
        .then(() => structUtils.dropHandle(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => dataIdUtils.getDataIdForStructuredData(authToken, SD_NAME, TYPE_TAG))
        .should.be.fulfilled()
        .then(res => structUtils.getHandle(authToken, res.data.handleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(404);
          should(err.response.data.errorCode).be.equal(-18);
        })
    ));

    it('Should be able to create and read structure data', () => (
      structUtils.create(authToken, SD_NAME, TYPE_TAG, null, SD_CONTENT)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          sdHandleId = res.data.handleId;
        })
        .then(() => structUtils.isSizeValid(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('isValid');
          should(res.data.isValid).be.Boolean();
        })
        .then(() => structUtils.put(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(() => structUtils.dropHandle(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => dataIdUtils.getDataIdForStructuredData(authToken, SD_NAME, TYPE_TAG))
        .should.be.fulfilled()
        .then(res => structUtils.getHandle(authToken, res.data.handleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys(
            'handleId',
            'isOwner',
            'version');
          should(isNaN(res.data.handleId)).not.be.ok();
          should(res.data.isOwner).be.Boolean();
          should(res.data.version).be.Number();
          sdHandleId = res.data.handleId;
        })
        .then(() => structUtils.getMetadata(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys(
            'isOwner',
            'version');
          should(res.data.isOwner).be.Boolean();
          should(res.data.version).be.Number();
        })
        .then(() => structUtils.read(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.equal(new Buffer(SD_CONTENT, 'base64').toString());
        })
    ));
  });

  describe('Update structured data', () => {
    const SD_NAME = crypto.randomBytes(32).toString('base64');
    const SD_NEW_CONTENT = new Buffer('test updated structured data').toString('base64');

    before(() => createSD(SD_NAME));
    after(() => (
      structUtils.delete(authToken, sdHandleId)
        .then(() => structUtils.dropHandle(authToken, sdHandleId))
    ));

    it('Should return 401 if authorisation token is not valid', () => (
      structUtils.update(null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 403 if low Level API Access is not provided', () => {
      let authTokenWithoutAccess = null;
      return authUtils.registerAndAuthorise()
        .then(token => (authTokenWithoutAccess = token))
        .then(() => structUtils.update(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should return 400 if data is not base64 buffer', () => (
      structUtils.update(authToken, sdHandleId, null, 11)
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(400))
    ));

    it('Should return 400 if cipherOptsHandle is not valid', () => (
      structUtils.update(authToken, sdHandleId, 11, 'test string')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1517);
          should(err.response.data.description).be.equal('FfiError::InvalidCipherOptHandle');
        })
    ));

    it('Should return 400 if invalid handleId is passed', () => (
      structUtils.update(authToken, invalidHandleId, null, SD_CONTENT)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1513);
          should(err.response.data.description).be.equal('FfiError::InvalidStructDataHandle');
        })
    ));

    it('Should be able to update structured data', () => (
      structUtils.update(authToken, sdHandleId, null, SD_NEW_CONTENT)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => structUtils.post(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(() => structUtils.getMetadata(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data.version).be.equal(1);
          should(res.data.isOwner).be.ok();
        })
        .then(() => structUtils.read(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.equal(new Buffer(SD_NEW_CONTENT, 'base64').toString());
        })
        .then(() => structUtils.update(authToken, sdHandleId, null, SD_NEW_CONTENT))
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => structUtils.post(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(() => structUtils.getMetadata(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data.version).be.equal(2);
          should(res.data.isOwner).be.ok();
        })
    ));
  });

  describe('Delete structure data', () => {
    const SD_NAME = crypto.randomBytes(32).toString('base64');

    before(() => createSD(SD_NAME));
    after(() => structUtils.dropHandle(authToken, sdHandleId));

    it('Should return 401 if authorisation token is not valid', () => (
      structUtils.delete(null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 400 if invalid handleId is passed', () => (
      structUtils.delete(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1513);
          should(err.response.data.description).be.equal('FfiError::InvalidStructDataHandle');
        })
    ));

    it('Should be able to delete structured data', () => (
      structUtils.delete(authToken, sdHandleId)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => structUtils.read(authToken, sdHandleId))
        .should.be.rejectedWith(Error)
    ));
  });

  describe('Serialise and deserialise structured data', () => {
    const SD_NAME = crypto.randomBytes(32).toString('base64');

    before(() => createSD(SD_NAME));
    after(() => (
      structUtils.delete(authToken, sdHandleId)
        .then(() => structUtils.dropHandle(authToken, sdHandleId))
    ));

    it('Should return 400 if invalid handleId is passed on serialise', () => (
      structUtils.serialise(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1513);
          should(err.response.data.description).be.equal('FfiError::InvalidStructDataHandle');
        })
    ));

    it('Should be able to serialise and deserialise structured data', () => (
      structUtils.serialise(authToken, sdHandleId, { responseType: 'arraybuffer' })
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.instanceof(Buffer);
          return new Uint8Array(res.data);
        })
        .then(data => structUtils.deserialise(authToken, data,
          { headers: { 'content-type': 'text/plain' } }))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys(
            'handleId',
            'isOwner',
            'version');
          should(isNaN(res.data.handleId)).not.be.ok();
          should(res.data.isOwner).be.Boolean();
          should(res.data.version).be.Number();
        })
    ));
  });

  describe('Make structured data unclaimable', () => {
    const SD_NAME = crypto.randomBytes(32).toString('base64');
    const SD_NEW_CONTENT = new Buffer('test updated structured data').toString('base64');

    before(() => createSD(SD_NAME));
    after(() => structUtils.dropHandle(authToken, sdHandleId));

    it('Should return 401 if authorisation token is not valid', () => (
      structUtils.makeStructuredDataUnclaimable(null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 403 if low Level API Access is not provided', () => {
      let authTokenWithoutAccess = null;
      return authUtils.registerAndAuthorise()
        .then(token => (authTokenWithoutAccess = token))
        .then(() => structUtils.makeStructuredDataUnclaimable(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should return 400 if invalid handleId is passed', () => (
      structUtils.makeStructuredDataUnclaimable(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1513);
          should(err.response.data.description).be.equal('FfiError::InvalidStructDataHandle');
        })
    ));

    it('Should be able to make structured data unclaimable', () => (
      structUtils.makeStructuredDataUnclaimable(authToken, sdHandleId)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => structUtils.dropHandle(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(() => dataIdUtils.getDataIdForStructuredData(authToken, SD_NAME, TYPE_TAG))
        .should.be.fulfilled()
        .then(res => structUtils.getHandle(authToken, res.data.handleId))
        .should.be.fulfilled()
        .then(res => structUtils.getMetadata(authToken, res.data.handleId))
        .then(() => structUtils.create(authToken, SD_NAME, TYPE_TAG, null, SD_NEW_CONTENT))
        .should.be.fulfilled()
        .then(res => (sdHandleId = res.data.handleId))
        .then(() => structUtils.put(authToken, sdHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-23);
          should(err.response.data.description.indexOf('DataExists')).be.not.equal(-1);
        })
    ));
  });

  describe('Get Data Id from Handle Id', () => {
    const SD_NAME = crypto.randomBytes(32).toString('base64');
    before(() => createSD(SD_NAME));
    after(() => (
      structUtils.delete(authToken, sdHandleId)
        .then(() => structUtils.dropHandle(authToken, sdHandleId))
    ));

    it('Should return 400 if invalid handleId is passed', () => (
      structUtils.asDataId(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1513);
          should(err.response.data.description).be.equal('FfiError::InvalidStructDataHandle');
        })
    ));

    it('Should be able to get data Id from \'handleId\'', () => (
      structUtils.asDataId(authToken, sdHandleId)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(isNaN(res.data.handleId)).not.be.ok();
          return res.data.handleId;
        })
        .then(handleId => dataIdUtils.dropHandle(authToken, handleId))
        .should.be.fulfilled()
    ));
  });

  describe('Claim Deleted structured data', () => {
    const SD_NAME = crypto.randomBytes(32).toString('base64');
    const SD_NEW_CONTENT = new Buffer('test updated structured data').toString('base64');

    before(() => (
      createSD(SD_NAME)
        .then(() => structUtils.delete(authToken, sdHandleId))
    ));

    after(() => (
      structUtils.delete(authToken, sdHandleId)
        .then(() => structUtils.dropHandle(authToken, sdHandleId))
    ));

    it('Should be able to claim deleted structured data', () => {
      let claimedSDVersion = null;

      return dataIdUtils.getDataIdForStructuredData(authToken, SD_NAME, TYPE_TAG)
        .should.be.fulfilled()
        .then(res => structUtils.getHandle(authToken, res.data.handleId))
        .should.be.fulfilled()
        .then(res => structUtils.getMetadata(authToken, res.data.handleId))
        .should.be.fulfilled()
        .then(res => {
          claimedSDVersion = res.data.version + 1;
          return structUtils.create(authToken, SD_NAME, TYPE_TAG, null,
            SD_NEW_CONTENT, claimedSDVersion);
        })
        .should.be.fulfilled()
        .then(res => (sdHandleId = res.data.handleId))
        .then(() => structUtils.put(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(() => structUtils.dropHandle(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(() => dataIdUtils.getDataIdForStructuredData(authToken, SD_NAME, TYPE_TAG))
        .should.be.fulfilled()
        .then(res => structUtils.getHandle(authToken, res.data.handleId))
        .should.be.fulfilled()
        .then(res => (sdHandleId = res.data.handleId))
        .then(() => structUtils.getMetadata(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => should(res.data.version).be.equal(claimedSDVersion))
        .then(() => structUtils.read(authToken, sdHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.equal(new Buffer(SD_NEW_CONTENT, 'base64').toString());
        });
    });
  });
});
