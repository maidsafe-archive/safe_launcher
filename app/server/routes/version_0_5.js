import express from 'express';
import bodyParser from 'body-parser';
import rawBodyParser from 'raw-body-parser';
import {addAppActivity} from '../utils';
import * as NFS from '../controllers/nfs';
import * as DNS from '../controllers/dns';
import * as Auth from '../controllers/auth';
import * as ImmutableData from '../controllers/immutable_data';
import * as DataId from '../controllers/data_id';
import * as CipherOpts from '../controllers/cipher_opts';
import * as StructuredData from '../controllers/structured_data';
import * as AppendableData from '../controllers/appendable_data';

var router = express.Router();

var jsonParser = bodyParser.json({strict: false});

var ActivityMiddleware = function (activityName) {
  this.onRequest = function (req, res, next) {
    addAppActivity(req, activityName);
    next();
  };
  return this.onRequest;
};

router.post('/auth', jsonParser,
  new ActivityMiddleware('Authorise app'), Auth.authorise);
router.get('/auth',
  new ActivityMiddleware('Validate app authorisation'), Auth.isTokenValid);
router.delete('/auth', new ActivityMiddleware('Revoke app'), Auth.revoke);

// NFS - DIRECTORY API
router.post('/nfs/directory/:rootPath/*', jsonParser,
  new ActivityMiddleware('Create directory'), NFS.createDirectory);
router.get('/nfs/directory/:rootPath/*',
  new ActivityMiddleware('Fetch directory'), NFS.getDirectory);
router.delete('/nfs/directory/:rootPath/*',
  new ActivityMiddleware('Delete directory'), NFS.deleteDirectory);
router.put('/nfs/directory/:rootPath/*', jsonParser,
  new ActivityMiddleware('Update directory'), NFS.modifyDirectory);
router.post('/nfs/movedir', jsonParser,
  new ActivityMiddleware('Move/copy directory'), NFS.moveDirectory);

// NFS - FILE API
router.post('/nfs/file/:rootPath/*',
  new ActivityMiddleware('Create file'), NFS.createFile);
router.delete('/nfs/file/:rootPath/*',
  new ActivityMiddleware('Delete file'), NFS.deleteFile);
router.put('/nfs/file/metadata/:rootPath/*', jsonParser,
  new ActivityMiddleware('Update file metadata'), NFS.modifyFileMeta);
// router.put('/nfs/file/:rootPath/*', new ActivityMiddleware('Update file'), NFS.modifyFileContent);
router.get('/nfs/file/:rootPath/*',
  new ActivityMiddleware('Read file'), NFS.getFile);
router.head('/nfs/file/:rootPath/*',
  new ActivityMiddleware('Fetch file metadata'), NFS.getFileMetadata);
router.post('/nfs/movefile', jsonParser,
  new ActivityMiddleware('Move/copy file'), NFS.moveFile);

// DNS API
router.post('/dns', jsonParser, new ActivityMiddleware('Register long name and service'), DNS.register);
router.post('/dns/:longName', new ActivityMiddleware('Create long name'), DNS.createPublicId);
router.put('/dns', jsonParser, new ActivityMiddleware('Add new service'), DNS.addService);
router.delete('/dns/:longName', new ActivityMiddleware('Delete DNS Record'), DNS.deleteDns);
router.delete('/dns/:serviceName/:longName', new ActivityMiddleware('Delete service'), DNS.deleteService);
router.get('/dns/:serviceName/:longName', new ActivityMiddleware('Get DNS home directory'), DNS.getHomeDirectory);
router.get('/dns/:serviceName/:longName/*', new ActivityMiddleware('Read public file'), DNS.getFile);
router.get('/dns', new ActivityMiddleware('List long names'), DNS.listLongNames);
router.get('/dns/:longName', new ActivityMiddleware('List services'), DNS.listServices);

// DATA-ID API
router.post('/data-id/structured-data', jsonParser, new ActivityMiddleware('Get dataId for Structured Data'),
  DataId.getDataIdForStructuredData);
router.post('/data-id/appendable-data', jsonParser, new ActivityMiddleware('Get dataId for Appendable Data'),
  DataId.getDataIdForAppendableData);
router.get('/data-id/:handleId', new ActivityMiddleware('Get serialised dataId'), DataId.serialise);
router.post('/data-id', rawBodyParser(), new ActivityMiddleware('Deserialise dataId'), DataId.deserialise);
router.delete('/data-id/:handleId', new ActivityMiddleware('Drop dataId handle'), DataId.dropHandle);

// cipher-opts
router.get('/cipher-opts/:encType/:keyHandle?', new ActivityMiddleware('Get cipher-opts handle'), CipherOpts.getHandle);
router.delete('/cipher-opts/:handleId', new ActivityMiddleware('Drop cipher-opts handle'), CipherOpts.dropHandle);

// ImmutableData API
router.get('/immutable-data/reader/:handleId', new ActivityMiddleware('Get ImmutableDataReader handle'),
  ImmutableData.getReaderHandle);
router.get('/immutable-data/writer', new ActivityMiddleware('Create ImmutableDataWriter handle'),
  ImmutableData.getWriterHandle);
router.get('/immutable-data/:handleId', new ActivityMiddleware('Read ImmutableData'), ImmutableData.read);
router.post('/immutable-data/:handleId', new ActivityMiddleware('Write ImmutableData'), ImmutableData.write);
router.put('/immutable-data/:handleId/:cipherOptsHandle', new ActivityMiddleware('Close ImmutableDataWriter handle'),
  ImmutableData.closeWriter);
router.delete('/immutable-data/reader/:handleId', new ActivityMiddleware('Close ImmutableDataReader handle'),
  ImmutableData.dropReader);
router.delete('/immutable-data/writer/:handleId', new ActivityMiddleware('Close ImmutableDataWriter handle'),
  ImmutableData.dropWriter);

// Structured Data
router.post('/structured-data/', jsonParser, new ActivityMiddleware('Create structured data'), StructuredData.create);
router.post('/structured-data/deserialise', rawBodyParser(),
  new ActivityMiddleware('De-Serialise structured data handle'), StructuredData.deserialise);
router.post('/structured-data/:handleId', new ActivityMiddleware('Save structured data - POST'), StructuredData.post);
router.get('/structured-data/metadata/:handleId', new ActivityMiddleware('Get metadata of structured data'),
  StructuredData.getMetadata);
router.get('/structured-data/handle/:dataIdHandle', new ActivityMiddleware('Get structured data handle'),
  StructuredData.getHandle);
router.get('/structured-data/data-id/:handleId',
  new ActivityMiddleware('Get data-id handle from structured data handle'), StructuredData.asDataId);
router.get('/structured-data/serialise/:handleId', new ActivityMiddleware('Get serialise structured data'),
  StructuredData.serialise);
router.get('/structured-data/validate-size/:handleId', new ActivityMiddleware('Validate size of structured data'),
  StructuredData.isSizeValid);
router.get('/structured-data/:handleId/:version?', new ActivityMiddleware('Read structured data'), StructuredData.read);
router.put('/structured-data/:handleId', new ActivityMiddleware('Save structured data - PUT'), StructuredData.put);
router.patch('/structured-data/:handleId', jsonParser, new ActivityMiddleware('Update data of structured data'),
  StructuredData.update);
router.delete('/structured-data/handle/:handleId', new ActivityMiddleware('Drop structured data handle'),
  StructuredData.dropHandle);
router.delete('/structured-data/unclaim/:handleId', new ActivityMiddleware('Make structured data unclaimable'),
  StructuredData.makeStructuredDataUnclaimable);
router.delete('/structured-data/:handleId', new ActivityMiddleware('Delete structured data'),
  StructuredData.deleteStructureData);

// AppendableData - encryptKey API
router.get('/appendable-data/encrypt-key/:handleId', new ActivityMiddleware('Get encrypt key'), AppendableData.getEncryptKey);
router.delete('/appendable-data/encrypt-key/:handleId', new ActivityMiddleware('Drop encrypt key handle'),
  AppendableData.dropEncryptKeyHandle);

// Appendable Data
router.post('/appendable-data', jsonParser, new ActivityMiddleware('Create appendable data'), AppendableData.create);
router.post('/appendable-data/deserialise', rawBodyParser(),
  new ActivityMiddleware('De-Serialise appendable data'), AppendableData.deserialise);
router.post('/appendable-data/:handleId', new ActivityMiddleware('Save appendable data - POST'), AppendableData.post);
router.get('/appendable-data/metadata/:handleId', new ActivityMiddleware('Get metadata of appendable data'),
  AppendableData.getMetadata);
router.get('/appendable-data/handle/:dataIdHandle', new ActivityMiddleware('Get appendable data handle'),
  AppendableData.getHandle);
router.get('/appendable-data/serialise/:handleId', new ActivityMiddleware('Serialise appendable data'),
  AppendableData.serialise);
router.get('/appendable-data/data-id/:handleId', new ActivityMiddleware('Get data-id handle from appendable data handle'),
  AppendableData.getDataIdHandle);
router.get('/appendable-data/validate-size/:handleId', new ActivityMiddleware('Validate size of appendable data'),
  AppendableData.isSizeValid);
router.get('/appendable-data/sign-key/deleted-data/:handleId/:index',
  new ActivityMiddleware('Get signing key from appendable data - deleted'),
  AppendableData.getSigningKeyFromDeletedData);
router.get('/appendable-data/sign-key/:handleId/:index', new ActivityMiddleware('Get signing key from appendable data'),
  AppendableData.getSigningKey);
router.get('/appendable-data/deleted-data/:handleId/:index',
  new ActivityMiddleware('Get DataId from appendable data - deleted'), AppendableData.getDeletedDataIdAt);
router.get('/appendable-data/filter/:handleId/:index',
  new ActivityMiddleware('Get SignKey from filter of AppendableData'), AppendableData.getSignKeyFromFilter);
router.get('/appendable-data/:handleId/:index', new ActivityMiddleware('Get DataId from appendable data'),
  AppendableData.getDataIdAt);
router.put('/appendable-data/toggle-filter/:handleId', new ActivityMiddleware('Toggle appendable data filter'),
  AppendableData.toggleFilter);
router.put('/appendable-data/filter/:handleId', jsonParser,
  new ActivityMiddleware('Add sign keys to appendable data filter'), AppendableData.addToFilter);
router.put('/appendable-data/:handleId/:dataIdHandle', new ActivityMiddleware('Append to appendable data'),
  AppendableData.append);
router.put('/appendable-data/restore/:handleId/:index',
  new ActivityMiddleware('Restore deleted data at an index of an appendable data'), AppendableData.restore);
router.put('/appendable-data/:handleId', new ActivityMiddleware('Save appendable data - PUT'), AppendableData.put);

router.delete('/appendable-data/filter/:handleId', jsonParser,
  new ActivityMiddleware('Remove sign keys from appendable data filter'), AppendableData.removeFromFilter);
router.delete('/appendable-data/deleted-data/:handleId/:index',
  new ActivityMiddleware('Remove from appendable data - deleted'), AppendableData.removeDeletedData);
router.delete('/appendable-data/clear-data/:handleId',
  new ActivityMiddleware('Move all data to deleted_data - appendable data'), AppendableData.clearData);
router.delete('/appendable-data/clear-deleted-data/:handleId',
  new ActivityMiddleware('Clear all deleted_data from appendable data'), AppendableData.clearDeletedData);
router.delete('/appendable-data/handle/:handleId', new ActivityMiddleware('Drop appendable data handle'),
  AppendableData.dropHandle);
router.delete('/appendable-data/:handleId/:index', new ActivityMiddleware('Remove from appendable data'),
  AppendableData.remove);
// router.delete('/appendable-data/:handleId',
//   new ActivityMiddleware('Delete appendable data'), AppendableData.deleteAppendableData);

router.get('/sign-key/serialise/:handleId', new ActivityMiddleware('Serialise sign key'),
  AppendableData.serialiseSignKey);
router.post('/sign-key/deserialise', rawBodyParser(), new ActivityMiddleware('De-Serialise sign key'),
  AppendableData.deserialiseSignKey);
router.delete('/sign-key/:handleId', rawBodyParser(), new ActivityMiddleware('Drop sign key'),
  AppendableData.dropSigningKeyHandle);

/*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
export {router as router_0_5};
/*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
