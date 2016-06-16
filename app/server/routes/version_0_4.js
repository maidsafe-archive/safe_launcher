import express from 'express';
import * as NFS from '../controllers/nfs';
import * as DNS from '../controllers/dns';
import * as Auth from '../controllers/auth';

var router = express.Router();
router.post('/auth', Auth.authorise);
router.get('/auth', Auth.isTokenValid);
router.delete('/auth', Auth.revoke);
// NFS - DIRECTORY API
router.post('/nfs/directory', NFS.createDirectory);
router.get('/nfs/directory/:dirPath/:isPathShared?', NFS.getDirectory);
router.delete('/nfs/directory/:dirPath/:isPathShared?', NFS.deleteDirectory);
router.put('/nfs/directory/:dirPath/:isPathShared?', NFS.modifyDirectory);
router.post('/nfs/movedir', NFS.moveDirectory);

// NFS - FILE API
router.post('/nfs/file', NFS.createFile);
router.post('/nfs/movefile', NFS.moveFile);
router.delete('/nfs/file/:filePath/:isPathShared?', NFS.deleteFile);
router.put('/nfs/file/metadata/:filePath/:isPathShared?', NFS.modifyFileMeta);
router.put('/nfs/file/:filePath/:isPathShared?', NFS.modifyFileContent);
router.get('/nfs/file/:filePath/:isPathShared?', NFS.getFile);

// DNS API
router.post('/dns', DNS.register);
router.post('/dns/:longName', DNS.createPublicId);
router.put('/dns', DNS.addService);
router.delete('/dns/:longName', DNS.deleteDns);
router.delete('/dns/:serviceName/:longName', DNS.deleteService);
router.get('/dns/:serviceName/:longName', DNS.getHomeDirectory);
router.get('/dns/:serviceName/:longName/:filePath', DNS.getFile);
router.get('/dns', DNS.listLongNames);
router.get('/dns/:longName', DNS.listServices);

export { router as router_0_4 };
