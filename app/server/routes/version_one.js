import express from 'express';
import * as NFS from '../controllers/nfs';
import * as DNS from '../controllers/dns';
import * as Auth from '../controllers/auth';

var router = express.Router();
router.post('/auth', Auth.authorise);
router.delete('/auth', Auth.revoke);
// NFS - DIRECTORY API
router.post('/nfs/directory', NFS.createDirectory);
router.get('/nfs/directory/:dirPath/:isPathShared', NFS.getDirectory);
router.delete('/nfs/directory/:dirPath/:isPathShared', NFS.deleteDirectory);
router.put('/nfs/directory/:dirPath/:isPathShared', NFS.modifyDirectory);
// NFS - FILE API
router.post('/nfs/file', NFS.createFile);
router.delete('/nfs/file/:filePath/:isPathShared', NFS.deleteFile);
router.put('/nfs/file/metadata/:filePath/:isPathShared', NFS.modifyFileMeta);
router.put('/nfs/file/:filePath/:isPathShared', NFS.modifyFileContent);
router.get('/nfs/file/:filePath/:isPathShared', NFS.getFile);
// DNS API
router.post('/dns/register', DNS.register);
router.post('/dns/service', DNS.addService);
export { router as versionOneRouter };
