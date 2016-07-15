import express from 'express';
import * as NFS from '../controllers/nfs';
import * as DNS from '../controllers/dns';
import * as Auth from '../controllers/auth';
import { addAppActivity } from '../utils';

var router = express.Router();

var ActivityMiddleware = function(activityName) {

    this.onRequest = function(req, res, next) {
        addAppActivity(req, activityName);
        next();
    };

    return this.onRequest;
};

router.post('/auth', new ActivityMiddleware('Authorise app'), Auth.authorise);
router.get('/auth', new ActivityMiddleware('Validate app authorisation'), Auth.isTokenValid);
router.delete('/auth', new ActivityMiddleware('Revoke app'), Auth.revoke);

// NFS - DIRECTORY API
router.post('/nfs/directory/:rootPath/*', new ActivityMiddleware('Create directory'), NFS.createDirectory);
router.get('/nfs/directory/:rootPath/*', new ActivityMiddleware('Fetch directory'), NFS.getDirectory);
router.delete('/nfs/directory/:rootPath/*', new ActivityMiddleware('Delete directory'), NFS.deleteDirectory);
router.put('/nfs/directory/:rootPath/*', new ActivityMiddleware('Update directory'), NFS.modifyDirectory);
router.post('/nfs/movedir', new ActivityMiddleware('Move/copy directory'), NFS.moveDirectory);

// NFS - FILE API
router.post('/nfs/file/:rootPath/*', new ActivityMiddleware('Create file'), NFS.createFile);
router.delete('/nfs/file/:rootPath/*', new ActivityMiddleware('Delete file'), NFS.deleteFile);
router.put('/nfs/file/metadata/:rootPath/*', new ActivityMiddleware('Update file metadata'), NFS.modifyFileMeta);
router.put('/nfs/file/:rootPath/*', new ActivityMiddleware('Update file'), NFS.modifyFileContent);
router.get('/nfs/file/:rootPath/*', new ActivityMiddleware('Read file'), NFS.getFile);
router.head('/nfs/file/:rootPath/*', new ActivityMiddleware('Fetch file metadata'), NFS.getFileMetadata);
router.post('/nfs/movefile', new ActivityMiddleware('Move/copy file'), NFS.moveFile);

// DNS API
router.post('/dns',new ActivityMiddleware('Register long name and service'), DNS.register);
router.post('/dns/:longName', new ActivityMiddleware('Create long name'), DNS.createPublicId);
router.put('/dns', new ActivityMiddleware('Add new service'), DNS.addService);
router.delete('/dns/:longName', new ActivityMiddleware('Delete DNS Record'), DNS.deleteDns);
router.delete('/dns/:serviceName/:longName', new ActivityMiddleware('Delete service'), DNS.deleteService);
router.get('/dns/:serviceName/:longName', new ActivityMiddleware('Get DNS home directory'), DNS.getHomeDirectory);
router.get('/dns/:serviceName/:longName/*', new ActivityMiddleware('Read public file'), DNS.getFile);
router.get('/dns', new ActivityMiddleware('List long names'), DNS.listLongNames);
router.get('/dns/:longName', new ActivityMiddleware('List services'), DNS.listServices);

export { router as router_0_5 };
