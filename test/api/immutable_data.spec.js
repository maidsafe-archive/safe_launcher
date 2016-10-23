import should from 'should';
import immutUtils from '../utils/immutable_data_utils';
import cipherUtils from '../utils/cipher_utils';
import dataIdUtils from '../utils/data_id_utils';
import authUtils from '../utils/auth_utils';
import { CONSTANTS, MESSAGES } from '../constants';

describe('Immutable data', () => {
  let authToken = null;
  const invalidHandleId = 1234;
  before(() => (
    authUtils.registerAndAuthorise(CONSTANTS.AUTH_PAYLOAD_LOW_LEVEL_API)
    .then(token => (authToken = token))
  ));
  after(() => authUtils.revokeApp(authToken));

  describe('Get writer handle', () => {
    it('Should return 401 if authorisation token is not valid', () => (
      immutUtils.getWriterHandle()
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
        .then(() => immutUtils.getWriterHandle(authTokenWithoutAccess))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });

    it('Should be able to get immutable data writer handle', () => (
      immutUtils.getWriterHandle(authToken)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          return res.data.handleId;
        })
        .then(handleId => immutUtils.dropWriter(authToken, handleId))
        .should.be.fulfilled()
    ));
  });

  describe('Write immutable data', () => {
    let writerHandleId = null;
    const content = new Buffer('Test sample');

    before(() => (
      immutUtils.getWriterHandle(authToken)
      .then(res => (writerHandleId = res.data.handleId))
    ));
    after(() => immutUtils.dropWriter(authToken, writerHandleId));

    it('Should return 401 if authorisation token is not valid', () => (
      immutUtils.write(null, writerHandleId)
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
        .then(() => immutUtils.write(authTokenWithoutAccess, writerHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });
    it('Should return 400 if writer handle is not valid', () => (
      immutUtils.write(authToken, invalidHandleId, content,
        { headers: { 'content-type': 'text/plain' } })
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1516);
          should(err.response.data.description).be.equal('FfiError::InvalidSelfEncryptorHandle');
        })
    ));
    it('Should be able to write data', () => (
      immutUtils.write(authToken, writerHandleId, content,
        { headers: { 'content-type': 'text/plain' } })
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
    ));
  });

  describe('Close writer', () => {
    let writerHandleId = null;
    const content = new Buffer('Test sample');

    before(() => (
      immutUtils.getWriterHandle(authToken)
        .then(res => (writerHandleId = res.data.handleId))
        .then(() => immutUtils.write(authToken, writerHandleId, content,
          { headers: { 'content-type': 'text/plain' } }))
    ));
    after(() => immutUtils.dropWriter(authToken, writerHandleId));

    it('Should return 401 if authorisation token is not valid', () => (
      immutUtils.closeWriter(null, writerHandleId)
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
        .then(() => immutUtils.closeWriter(authTokenWithoutAccess, writerHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });
    it('Should return 400 if writer handle is not valid', () => (
      immutUtils.closeWriter(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          // should(err.response.data.errorCode).be.equal(-1516);
          // should(err.response.data.description).be.equal('FfiError::InvalidSelfEncryptorHandle');
        })
    ));
    it('Should be able to close writer', () => {
      let cipherHandle = null;
      return cipherUtils.getHandle(authToken, CONSTANTS.ENCRYPTION.PLAIN)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          cipherHandle = res.data.handleId;
        })
        .then(() => immutUtils.closeWriter(authToken, writerHandleId, cipherHandle))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          return res.data.handleId;
        })
        .then(handleId => dataIdUtils.dropHandle(authToken, handleId))
        .should.be.fulfilled()
        .then(() => cipherUtils.dropHandle(authToken, cipherHandle))
        .should.be.fulfilled();
    });
    it('Should be able to close writer for symmetric encryption', () => {
      let cipherHandle = null;
      return cipherUtils.getHandle(authToken, CONSTANTS.ENCRYPTION.SYMMETRIC)
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          cipherHandle = res.data.handleId;
        })
        .then(() => immutUtils.closeWriter(authToken, writerHandleId, cipherHandle))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).have.keys('handleId');
          should(res.data.handleId).be.Number();
          return res.data.handleId;
        })
        .then(handleId => dataIdUtils.dropHandle(authToken, handleId))
        .should.be.fulfilled()
        .then(() => cipherUtils.dropHandle(authToken, cipherHandle))
        .should.be.fulfilled();
    });
  });

  describe('Get reader handle', () => {
    let writerHandleId = null;
    let cipherHandle = null;
    let handleId = null;
    const content = new Buffer('Test sample');

    before(() => (
      cipherUtils.getHandle(authToken, CONSTANTS.ENCRYPTION.PLAIN)
        .then(res => (cipherHandle = res.data.handleId))
        .then(() => immutUtils.getWriterHandle(authToken))
        .then(res => (writerHandleId = res.data.handleId))
        .then(() => immutUtils.write(authToken, writerHandleId, content,
          { headers: { 'content-type': 'text/plain' } }))
        .then(() => immutUtils.closeWriter(authToken, writerHandleId, cipherHandle))
        .then(res => (handleId = res.data.handleId))
    ));
    after(() => (
      cipherUtils.dropHandle(authToken, cipherHandle)
        .then(() => dataIdUtils.dropHandle(authToken, handleId))
        .then(() => immutUtils.dropWriter(authToken, writerHandleId))
    ));
    it('Should return 400 if writer handle is not valid', () => (
      immutUtils.getReaderHandle(null, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1514);
          should(err.response.data.description).be.equal('FfiError::InvalidDataIdHandle');
        })
    ));
    it('Should be able to get reader handle', () => (
      immutUtils.getReaderHandle(null, handleId)
      .should.be.fulfilled()
      .then(res => {
        should(res.status).be.equal(200);
        should(res.data).have.keys('handleId', 'size');
        should(res.data.handleId).be.Number();
        should(res.data.size).be.Number();
        return res.data.handleId;
      })
      .then(immutHandleId => immutUtils.dropReader(null, immutHandleId))
      .should.be.fulfilled()
    ));
  });

  describe('Read immutable data', () => {
    let writerHandleId = null;
    let readerHandleId = null;
    let cipherHandle = null;
    let handleId = null;
    const content = 'Test sample';

    const writeImmutData = (encryptionType) => (
      cipherUtils.getHandle(authToken, encryptionType)
        .then(res => (cipherHandle = res.data.handleId))
        .then(() => immutUtils.getWriterHandle(authToken))
        .then(res => (writerHandleId = res.data.handleId))
        .then(() => immutUtils.write(authToken, writerHandleId, content,
          { headers: { 'content-type': 'text/plain' } }))
        .then(() => immutUtils.closeWriter(authToken, writerHandleId, cipherHandle))
        .then(res => (handleId = res.data.handleId))
        .then(() => immutUtils.getReaderHandle(authToken, handleId))
        .then(res => (readerHandleId = res.data.handleId))
    );

    const dropHandles = () => (
      cipherUtils.dropHandle(authToken, cipherHandle)
        .then(() => dataIdUtils.dropHandle(authToken, handleId))
        .then(() => immutUtils.dropWriter(authToken, writerHandleId))
        .then(() => immutUtils.dropReader(authToken, readerHandleId))
    );

    it('Should return 400 if reader handle is not valid', () => (
      immutUtils.read(null, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1516);
          should(err.response.data.description).be.equal('FfiError::InvalidSelfEncryptorHandle');
        })
    ));
    it('Should be able to read immutable data', () => (
      writeImmutData(CONSTANTS.ENCRYPTION.PLAIN)
        .then(() => immutUtils.read(null, readerHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.equal(content);
        })
        .then(() => dropHandles())
    ));
    it('Should be able to read immutable data for symmetric encryption', () => (
      writeImmutData(CONSTANTS.ENCRYPTION.SYMMETRIC)
        .then(() => immutUtils.read(null, readerHandleId))
        .should.be.fulfilled()
        .then(res => {
          should(res.status).be.equal(200);
          should(res.data).be.equal(content);
        })
        .then(() => dropHandles())
    ));
  });

  describe('Drop Writer handle', () => {
    let writerHandleId = null;

    before(() => (
      immutUtils.getWriterHandle(authToken)
      .then(res => (writerHandleId = res.data.handleId))
    ));

    it('Should return 401 if authorisation token is not valid', () => (
      immutUtils.dropWriter(null, writerHandleId)
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
        .then(() => immutUtils.dropWriter(authTokenWithoutAccess, writerHandleId))
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(403);
          should(err.response.data.errorCode).be.equal(400);
          should(err.response.data.description).be.equal(MESSAGES.LOW_LEVEL_API_ACCESS_NOT_GRANTED);
        })
        .then(() => authUtils.revokeApp(authTokenWithoutAccess));
    });
    it('Should return 400 if writer handle is not valid', () => (
      immutUtils.dropWriter(authToken, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1516);
          should(err.response.data.description).be.equal('FfiError::InvalidSelfEncryptorHandle');
        })
    ));
    it('Should be able to drop handle', () => (
      immutUtils.dropWriter(authToken, writerHandleId)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
    ));
  });

  describe('Drop Reader handle', () => {
    let writerHandleId = null;
    let readerHandleId = null;
    let cipherHandle = null;
    let handleId = null;
    const content = new Buffer('Test sample');

    before(() => (
      cipherUtils.getHandle(authToken, CONSTANTS.ENCRYPTION.PLAIN)
        .then(res => (cipherHandle = res.data.handleId))
        .then(() => immutUtils.getWriterHandle(authToken))
        .then(res => (writerHandleId = res.data.handleId))
        .then(() => immutUtils.write(authToken, writerHandleId, content,
          { headers: { 'content-type': 'text/plain' } }))
        .then(() => immutUtils.closeWriter(authToken, writerHandleId, cipherHandle))
        .then(res => (handleId = res.data.handleId))
        .then(() => immutUtils.getReaderHandle(authToken, handleId))
        .then(res => (readerHandleId = res.data.handleId))
    ));
    after(() => (
      cipherUtils.dropHandle(authToken, cipherHandle)
        .then(() => dataIdUtils.dropHandle(authToken, handleId))
        .then(() => immutUtils.dropWriter(authToken, writerHandleId))
    ));

    it('Should return 400 if reader handle is not valid', () => (
      immutUtils.dropReader(null, invalidHandleId)
        .should.be.rejectedWith(Error)
        .then(err => {
          should(err.response.status).be.equal(400);
          should(err.response.data.errorCode).be.equal(-1516);
          should(err.response.data.description).be.equal('FfiError::InvalidSelfEncryptorHandle');
        })
    ));
    it('Should be able to drop handle', () => (
      immutUtils.dropReader(null, readerHandleId)
        .should.be.fulfilled()
        .then(res => should(res.status).be.equal(200))
    ));
  });
});
