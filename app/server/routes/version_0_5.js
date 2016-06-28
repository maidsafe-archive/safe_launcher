import express from 'express';
import * as NFS from '../controllers/nfs';
import * as DNS from '../controllers/dns';
import * as Auth from '../controllers/auth';

var router = express.Router();
router.post('/auth', Auth.authorise);
router.get('/auth', Auth.isTokenValid);
router.delete('/auth', Auth.revoke);
// NFS - DIRECTORY API
router.post('/nfs/directory/:rootPath/*', NFS.createDirectory);
router.get('/nfs/directory/:rootPath/*', NFS.getDirectory);
router.delete('/nfs/directory/:rootPath/*', NFS.deleteDirectory);
router.put('/nfs/directory/:rootPath/*', NFS.modifyDirectory);
router.post('/nfs/movedir', NFS.moveDirectory);

// NFS - FILE API
router.post('/nfs/file/:rootPath/*', NFS.createFile);
router.delete('/nfs/file/:rootPath/*', NFS.deleteFile);
router.put('/nfs/file/metadata/:rootPath/*', NFS.modifyFileMeta);
router.put('/nfs/file/:rootPath/*', NFS.modifyFileContent);
router.get('/nfs/file/:rootPath/*', NFS.getFile);
router.head('/nfs/file/:rootPath/*', NFS.getFileMetadata);
router.post('/nfs/movefile', NFS.moveFile);

// DNS API
router.post('/dns', DNS.register);
router.post('/dns/:longName', DNS.createPublicId);
router.put('/dns', DNS.addService);
router.delete('/dns/:longName', DNS.deleteDns);
router.delete('/dns/:serviceName/:longName', DNS.deleteService);
router.get('/dns/:serviceName/:longName', DNS.getHomeDirectory);
router.get('/dns/:serviceName/:longName/*', DNS.getFile);
router.get('/dns', DNS.listLongNames);
router.get('/dns/:longName', DNS.listServices);

export { router as router_0_5 };
