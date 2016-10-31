import should from 'should';
import crypto from 'crypto';
import adUtils from '../utils/appendable_data_utils';
import structUtils from '../utils/structured_data_utils';
import dataIdUtils from '../utils/data_id_utils';
import signKeyUtils from '../utils/sign_key_utils';
import authUtils from '../utils/auth_utils';
import { CONSTANTS, MESSAGES } from '../constants';

describe('Appendable data', () => {
  const invalidHandleId = 1234;
  const SD_CONTENT = new Buffer('test structured data').toString('base64');
  let authToken = null;
  let adHandleId = null;

  const createSD = () => {
    let sdHandleId = null;
    let dataIdhandle = null;
    return structUtils.create(authToken, crypto.randomBytes(32).toString('base64')
      , 500, null, SD_CONTENT)
      .then(res => (sdHandleId = res.data.handleId))
      .then(() => structUtils.put(authToken, sdHandleId))
      .then(() => structUtils.asDataId(authToken, sdHandleId))
      .then(res => (dataIdhandle = res.data.handleId))
      .then(() => structUtils.dropHandle(authToken, sdHandleId))
      .then(() => dataIdhandle);
  };

  const readSD = (dataIdhandle) => {
    let handleId = null;
    let data = null;
    return structUtils.getHandle(authToken, dataIdhandle)
      .then(res => (handleId = res.data.handleId))
      .then(() => structUtils.read(authToken, handleId))
      .then(res => (data = res.data))
      .then(() => structUtils.dropHandle(authToken, handleId))
      .then(() => data);
  };

  const dropAndGetHandle = (name, isPrivate) => {
    let dataIdHandle = null;
    return adUtils.dropHandle(authToken, adHandleId)
      .then(() => dataIdUtils.getDataIdForAppendableData(authToken, name, isPrivate))
      .then(res => (dataIdHandle = res.data.handleId))
      .then(() => adUtils.getHandle(authToken, dataIdHandle))
      .then(res => (adHandleId = res.data.handleId))
      .then(() => dataIdUtils.dropHandle(authToken, dataIdHandle));
  };

  const createAD = (name, isPrivate) => (
    adUtils.create(authToken, name, isPrivate)
      .then(res => (adHandleId = res.data.handleId))
      .then(() => adUtils.put(authToken, adHandleId))
      .then(() => dropAndGetHandle(name, isPrivate))
  );

  const appendSD = (dataIdhandle, name, isPrivate) => (
    adUtils.append(authToken, adHandleId, dataIdhandle)
      .then(() => dropAndGetHandle(name, isPrivate))
      .then(() => dataIdUtils.dropHandle(authToken, dataIdhandle))
  );

  before(() => (
    authUtils.registerAndAuthorise(CONSTANTS.AUTH_PAYLOAD_LOW_LEVEL_API)
      .then(token => (authToken = token))
  ));
  after(() => authUtils.revokeApp(authToken));

  describe('Create, Append and Read Appendable data', () => {
    const AD_NAME = crypto.randomBytes(32).toString('base64');
    const sdDataHandles = [];

    after(() => (
      adUtils.dropHandle(authToken, adHandleId)
        .then(() => Promise.all(sdDataHandles.map(
          sdHandle => dataIdUtils.dropHandle(authToken, sdHandle))))
    ));

    it('Should return 401 if authorisation token is not valid', () => (
      adUtils.create(null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
        .then(() => adUtils.put(null))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
        .then(() => adUtils.append(null))
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
        .then(() => adUtils.create(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => adUtils.put(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => adUtils.append(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should return 400 if name param not found on creation', () => (
      adUtils.create(authToken)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal('name field is missing');
        })
    ));

    it('Should return 400 if name is not a base64 buffer on creation', () => (
      adUtils.create(authToken, 11)
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(400))
    ));

    it('Should return 400 if isPrivate is not a boolean type on creation', () => (
      adUtils.create(authToken, AD_NAME, 'test')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description.indexOf('isPrivate')).not.be.equal(-1);
        })
    ));

    // put
    it('Should return 400 if handle Id is not valid on put', () => (
      adUtils.put(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1515);
          should(err.response.data.description).be.equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    it('Should return 400 if handle Id is not valid on isSizeValid check', () => (
      adUtils.isSizeValid(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1515);
          should(err.response.data.description).be.equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    it('Should return 400 if handle Id is not valid on getHandle', () => (
      adUtils.getHandle(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1514);
          should(err.response.data.description).be.equal('FfiError::InvalidDataIdHandle');
        })
    ));

    it('Should return 400 if handle Id is not valid on dropHandle', () => (
      adUtils.dropHandle(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1515);
          should(err.response.data.description).be.equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    it('Should return 400 if handle Id is not valid on append', () => (
      adUtils.append(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 400 if data Id handle is not valid on append', () => (
      adUtils.append(authToken, adHandleId, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 400 if handle Id is not valid on getDataIdAt', () => (
      adUtils.getDataIdAt(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should be able to create appendable data', () => {
      let dataIdHandle = null;
      return adUtils.create(authToken, AD_NAME)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          adHandleId = res.data.handleId;
        })
        .then(() => adUtils.put(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => adUtils.isSizeValid(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('isValid');
          should(res.data.isValid).be.ok();
        })
        .then(() => adUtils.dropHandle(authToken, adHandleId))
        .should.be.fulfilled()
        .then(() => dataIdUtils.getDataIdForAppendableData(authToken, AD_NAME))
        .should.be.fulfilled()
        .then(res => (dataIdHandle = res.data.handleId))
        .then(() => adUtils.getHandle(authToken, dataIdHandle))
        .should.be.fulfilled()
        .then(res => (adHandleId = res.data.handleId))
        .then(() => dataIdUtils.dropHandle(authToken, dataIdHandle))
        .should.be.fulfilled()
        .then(() => createSD())
        .then(handleId => sdDataHandles.push(handleId))
        .then(() => adUtils.append(authToken, adHandleId, sdDataHandles[0]))
        .should.be.fulfilled()
        .then(() => createSD())
        .then(handleId => sdDataHandles.push(handleId))
        .then(() => adUtils.append(authToken, adHandleId, sdDataHandles[1]))
        .should.be.fulfilled()
        .then(() => createSD())
        .then(handleId => sdDataHandles.push(handleId))
        .then(() => adUtils.append(authToken, adHandleId, sdDataHandles[2]))
        .should.be.fulfilled()
        .then(() => adUtils.dropHandle(authToken, adHandleId))
        .should.be.fulfilled()
        .then(() => dataIdUtils.getDataIdForAppendableData(authToken, AD_NAME))
        .should.be.fulfilled()
        .then(res => (dataIdHandle = res.data.handleId))
        .then(() => adUtils.getHandle(authToken, dataIdHandle))
        .should.be.fulfilled()
        .then(res => (adHandleId = res.data.handleId))
        .then(() => dataIdUtils.dropHandle(authToken, dataIdHandle))
        .should.be.fulfilled()
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys(
            'handleId',
            'isOwner',
            'version',
            'filterLength',
            'dataLength',
            'deletedDataLength');
          should(res.data.dataLength).be.equal(sdDataHandles.length);
        })
        .then(() => adUtils.getDataIdAt(authToken, adHandleId, 0))
        .should.be.fulfilled()
        .then(res => readSD(res.data.handleId))
        .then(data => should(data).be.equal(new Buffer(SD_CONTENT, 'base64').toString()))
        .then(() => adUtils.getDataIdAt(authToken, adHandleId, 1))
        .should.be.fulfilled()
        .then(res => readSD(res.data.handleId))
        .then(data => should(data).be.equal(new Buffer(SD_CONTENT, 'base64').toString()))
        .then(() => adUtils.getDataIdAt(authToken, adHandleId, 2))
        .should.be.fulfilled()
        .then(res => readSD(res.data.handleId))
        .then(data => should(data).be.equal(new Buffer(SD_CONTENT, 'base64').toString()));
    });

    it('Should return 400 if appendable data already exist with the same name', () => (
      adUtils.create(authToken, AD_NAME)
        .then(res => adUtils.put(authToken, res.data.handleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-23);
          should(err.response.data.description.indexOf('DataExists')).not.be.equal(-1);
        })
    ));
  });

  describe('Remove, restore, delete and remove deleted data', () => {
    const AD_NAME = crypto.randomBytes(32).toString('base64');

    before(() => createAD(AD_NAME));

    after(() => adUtils.dropHandle(authToken, adHandleId));

    it('Should return 401 if authorisation token is not valid on remove and restore', () => (
      adUtils.removeAt(null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
        .then(() => adUtils.restore(null, adHandleId, 0))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 403 if low Level API Access is not provided on remove and restore', () => {
      let authTokenWithoutAccess = null;
      return authUtils.registerAndAuthorise()
        .then(token => (authTokenWithoutAccess = token))
        .then(() => adUtils.removeAt(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => adUtils.restore(authTokenWithoutAccess, adHandleId, 0))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should return 400 if handle Id is not valid', () => (
      adUtils.removeAt(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 400 if index is not valid', () => (
      adUtils.removeAt(authToken, adHandleId, 123)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1524);
          should(err.response.data.description).be.equal('FfiError::InvalidIndex');
        })
    ));

    it('Should return 400 if handleId is not valid on getDeletedDataIdAt', () => (
      adUtils.getDeletedDataIdAt(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
        })
    ));

    it('Should return 400 if index is not valid on getDeletedDataIdAt', () => (
      adUtils.getDeletedDataIdAt(authToken, adHandleId, 123)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1524);
          should(err.response.data.description).be.equal('FfiError::InvalidIndex');
        })
    ));

    it('Should return 400 if index of retore is not a number', () => (
      adUtils.restore(authToken, adHandleId, 'test')
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal('index must be a valid number');
        })
    ));

    it('Should be able to remove, restore data, get deleted data and delete deleted data', () => (
      createSD()
        .then(handleId => appendSD(handleId, AD_NAME))
        .then(() => adUtils.removeAt(authToken, adHandleId, 0))
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => should(res.data.deletedDataLength).be.equal(1))
        .then(() => adUtils.getDeletedDataIdAt(authToken, adHandleId, 0))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          return res.data.handleId;
        })
        .then(handleId => dataIdUtils.dropHandle(authToken, handleId))
        .then(() => adUtils.restore(authToken, adHandleId, 0))
        .should.be.fulfilled()
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.data.dataLength).be.equal(1);
          should(res.data.deletedDataLength).be.equal(0);
        })
        .then(() => adUtils.removeAt(authToken, adHandleId, 0))
        .should.be.fulfilled()
        .then(() => adUtils.removeDeletedData(authToken, adHandleId, 0))
        .should.be.fulfilled()
        .then(() => dropAndGetHandle(AD_NAME))
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => should(res.data.deletedDataLength).be.equal(0))
    ));
  });

  describe('Clear all data and deleted data', () => {
    const AD_NAME = crypto.randomBytes(32).toString('base64');

    before(() => (
      createAD(AD_NAME)
        .then(() => createSD())
        .then(handleId => appendSD(handleId, AD_NAME))
    ));

    after(() => adUtils.dropHandle(authToken, adHandleId));

    it('Should return 401 if authorisation token is not valid', () => (
      adUtils.clearData(null)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
        .then(() => adUtils.clearDeletedData(null))
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
        .then(() => adUtils.clearData(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => adUtils.clearDeletedData(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should return 400 if handle Id is not valid on post', () => (
      adUtils.post(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1515);
          should(err.response.data.description).be.equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    // TODO must check
    // it('Should return 400 if handle Id is not valid on clear data', () => (
    //   adUtils.clearData(authToken, invalidHandleId)
    //     .should.be.rejectedWith(Error)
    //     .then(err => {
    //       should(err.response.status).be.equal(400);
    //       should(err.response.data.errorCode).be.equal(400);
    //     })
    // ));

    // TODO must check
    // it('Should return 400 if handle Id is not valid on clear deleted data', () => (
    //   adUtils.clearDeletedData(authToken, invalidHandleId)
    //     .should.be.rejectedWith(Error)
    //       .then(err => {
    //         should(err.response.status).be.equal(400);
    //         should(err.response.data.errorCode).be.equal(400);
    //       })
    // ));

    it('Should be able to clear data and deleted data', () => (
      adUtils.clearData(authToken, adHandleId)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => adUtils.post(authToken, adHandleId))
        .should.be.fulfilled()
        .then(() => dropAndGetHandle(AD_NAME))
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.data.dataLength).be.equal(0);
          should(res.data.deletedDataLength).not.be.equal(0);
        })
        .then(() => adUtils.clearDeletedData(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => adUtils.post(authToken, adHandleId))
        .should.be.fulfilled()
        .then(() => dropAndGetHandle(AD_NAME))
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.data.dataLength).be.equal(0);
          should(res.data.deletedDataLength).be.equal(0);
        })
    ));
  });

  describe('Add key, remove key and toggle key from filter', () => {
    const AD_NAME = crypto.randomBytes(32).toString('base64');
    let signKeyHandleId = null;
    let dataIdHandle = null;

    before(() => (
      createAD(AD_NAME)
        .then(() => createSD())
        .then(handleId => appendSD(handleId, AD_NAME))
    ));

    after(() => adUtils.dropHandle(authToken, adHandleId));

    it('Should return 401 if authorisation token is not valid', () => (
      adUtils.getSigningKey(null, adHandleId, 0)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
        .then(() => adUtils.addToFilter(null, adHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
        .then(() => adUtils.toggleFilter(null, adHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
        .then(() => adUtils.removeFromFilter(null, adHandleId))
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
        .then(() => adUtils.getSigningKey(authTokenWithoutAccess, adHandleId, 0))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => adUtils.addToFilter(authTokenWithoutAccess, adHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => adUtils.toggleFilter(authTokenWithoutAccess, adHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => adUtils.removeFromFilter(authTokenWithoutAccess, adHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    // TODO must check
    it('Should return 400 if handle Id is not valid on getSigningKey', () => (
      adUtils.getSigningKey(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          // should(err.response.data.errorCode).be.equal(-1519);
          // should(err.response.data.description).be
          // .equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    // TODO must check
    it('Should return 400 if handle Id is not valid on addToFilter', () => (
      adUtils.addToFilter(authToken, invalidHandleId, [21])
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          // should(err.response.data.errorCode).be.equal(400);
          // should(err.response.data.description).be
          // .equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    it('Should return 400 if signKey is not valid on addToFilter', () => (
      adUtils.addToFilter(authToken, adHandleId, [21])
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1519);
          should(err.response.data.description).be.equal('FfiError::InvalidSignKeyHandle');
        })
    ));

    it('Should return 400 if handle Id is not valid on toggleFilter', () => (
      adUtils.toggleFilter(authToken, invalidHandleId, [21])
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1515);
          should(err.response.data.description).be.equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    // TODO must check
    it('Should return 400 if handle Id is not valid on removeFromFilter', () => (
      adUtils.removeFromFilter(authToken, invalidHandleId, [21])
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          // should(err.response.data.errorCode).be.equal(-1515);
          // should(err.response.data.description).be
          // .equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    it('Should return 400 if signKey is not valid on removeFromFilter', () => (
      adUtils.addToFilter(authToken, adHandleId, [21])
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1519);
          should(err.response.data.description).be.equal('FfiError::InvalidSignKeyHandle');
        })
    ));

    it('Should be able to Add and remove keys in filter and toggle filter', () => (
      adUtils.getSigningKey(authToken, adHandleId, 0)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          signKeyHandleId = res.data.handleId;
        })
        .then(() => adUtils.addToFilter(authToken, adHandleId, [signKeyHandleId]))
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
        .then(() => signKeyUtils.dropHandle(authToken, signKeyHandleId))
        .should.be.fulfilled()
        .then(() => createSD())
        .then(() => adUtils.append(authToken, adHandleId, dataIdHandle))
        .should.be.rejectedWith(Error)
        .then(err => should(err.response.status).be.equal(400))
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => should(res.data.filterLength).be.equal(1))
        .then(() => adUtils.getSignKeyFromFilter(authToken, adHandleId, 0))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          signKeyHandleId = res.data.handleId;
        })
        .then(() => adUtils.toggleFilter(authToken, adHandleId))
        .should.be.fulfilled()
        .then(() => dropAndGetHandle(AD_NAME))
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
      // .then(res => console.log(res.data)) // filter type not found
        .then(() => adUtils.toggleFilter(authToken, adHandleId))
        .should.be.fulfilled()
        .then(() => dropAndGetHandle(AD_NAME))
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
      // .then(res => console.log(res.data)) // filter type not found
        .then(() => adUtils.removeFromFilter(authToken, adHandleId, [signKeyHandleId]))
        .should.be.fulfilled()
        .then(() => createSD())
        .then(handleId => (dataIdHandle = handleId))
        .then(() => adUtils.append(authToken, adHandleId, dataIdHandle))
        .should.be.fulfilled()
        .then(() => dataIdUtils.dropHandle(authToken, dataIdHandle))
        .should.be.fulfilled()
    ));
  });

  describe('Serialise and deserialise data', () => {
    const AD_NAME = crypto.randomBytes(32).toString('base64');
    before(() => (
      createAD(AD_NAME)
        .then(() => createSD())
        .then(handleId => appendSD(handleId, AD_NAME))
    ));

    after(() => adUtils.dropHandle(authToken, adHandleId));

    it('Should return 401 if authorisation token is not valid', () => (
      adUtils.serialise(null, adHandleId)
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
        .then(() => adUtils.serialise(authTokenWithoutAccess, adHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should return 400 if handle Id is not valid on serialise', () => (
      adUtils.serialise(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1515);
          should(err.response.data.description).be.equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    it('Should be able to serialise and deserialise data', () => (
      adUtils.serialise(authToken, adHandleId, { responseType: 'arraybuffer' })
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.ok();
          return new Uint8Array(res.data);
        })
        .then(data => adUtils.deserialise(authToken, data,
          { headers: { 'content-type': 'text/plain' } }))
        .should.be.fulfilled()
    ));
  });

  describe('Get signkey from deleted data', () => {
    const AD_NAME = crypto.randomBytes(32).toString('base64');
    before(() => (
      createAD(AD_NAME)
        .then(() => createSD())
        .then(handleId => appendSD(handleId, AD_NAME))
    ));

    after(() => adUtils.dropHandle(authToken, adHandleId));

    it('Should return 401 if authorisation token is not valid', () => (
      adUtils.getSigningKeyFromDeletedData(null, adHandleId, 0)
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
        .then(() => adUtils.getSigningKeyFromDeletedData(authTokenWithoutAccess, adHandleId, 0))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should return 400 if handle Id is not valid', () => (
      adUtils.getSigningKeyFromDeletedData(authToken, invalidHandleId, 0)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1515);
          should(err.response.data.description).be.equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    it('Should return 400 if index is not valid', () => (
      adUtils.getSigningKeyFromDeletedData(authToken, adHandleId, 0)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1524);
          should(err.response.data.description).be.equal('FfiError::InvalidIndex');
        })
    ));

    it('Should be able to get signkey from deleted data', () => (
      adUtils.clearData(authToken, adHandleId)
        .should.be.fulfilled()
        .then(() => adUtils.post(authToken, adHandleId))
        .should.be.fulfilled()
        .then(() => adUtils.getMetadata(authToken, adHandleId))
        .should.be.fulfilled()
        .then(res => should(res.data.deletedDataLength).not.be.equal(0))
        .then(() => adUtils.getSigningKeyFromDeletedData(authToken, adHandleId, 0))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          return res.data.handleId;
        })
        .then(handleId => signKeyUtils.dropHandle(authToken, handleId))
        .should.be.fulfilled()
    ));
  });

  describe('Get encrypt key and drop it', () => {
    const AD_NAME = crypto.randomBytes(32).toString('base64');
    before(() => (
      createAD(AD_NAME, true)
        .then(() => createSD())
        .then(handleId => appendSD(handleId, AD_NAME, true))
        .then(() => dropAndGetHandle(AD_NAME, true))
    ));

    after(() => adUtils.dropHandle(authToken, adHandleId));

    it('Should return 401 if authorisation token is not valid', () => (
      adUtils.getEncryptKey(null, adHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(401);
          should(err.response.data.errorCode).be.equal(400);
        })
        .then(() => adUtils.dropEncryptKeyHandle(null, adHandleId))
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
        .then(() => adUtils.getEncryptKey(authTokenWithoutAccess, adHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => adUtils.dropEncryptKeyHandle(authTokenWithoutAccess, adHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should return 400 if handle Id is not valid', () => (
      adUtils.getEncryptKey(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1515);
          should(err.response.data.description).be.equal('FfiError::InvalidAppendableDataHandle');
        })
        .then(() => adUtils.dropEncryptKeyHandle(authToken, invalidHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1518);
          should(err.response.data.description).be.equal('FfiError::InvalidEncryptKeyHandle');
        })
    ));

    it('Should be able to get encrypt key handle and drop it', () => (
      adUtils.getEncryptKey(authToken, adHandleId)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          return res.data.handleId;
        })
        .then(handleId => adUtils.dropEncryptKeyHandle(authToken, handleId))
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
    ));
  });

  describe('Get DataId Handle', () => {
    const AD_NAME = crypto.randomBytes(32).toString('base64');
    before(() => (
      createAD(AD_NAME)
        .then(() => createSD())
        .then(handleId => appendSD(handleId, AD_NAME))
    ));

    after(() => adUtils.dropHandle(authToken, adHandleId));

    it('Should return 400 if handle Id is not valid', () => (
      adUtils.getDataIdHandle(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1515);
          should(err.response.data.description).be.equal('FfiError::InvalidAppendableDataHandle');
        })
    ));

    it('Should be able to get DataId handle', () => (
      adUtils.getDataIdHandle(authToken, adHandleId)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          return res.data.handleId;
        })
        .then(handleId => dataIdUtils.dropHandle(authToken, handleId))
        .should.be.fulfilled()
    ));
  });
});
