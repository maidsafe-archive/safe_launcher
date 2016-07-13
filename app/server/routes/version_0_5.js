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

router.post('/auth', new ActivityMiddleware('Application authorisation request'), Auth.authorise);
router.get('/auth', new ActivityMiddleware('Application validating its authorisation'), Auth.isTokenValid);
router.delete('/auth', new ActivityMiddleware('Application revoking its authorisation'), Auth.revoke);

// NFS - DIRECTORY API
router.post('/nfs/directory/:rootPath/*', new ActivityMiddleware('Creating directory'), NFS.createDirectory);
router.get('/nfs/directory/:rootPath/*', new ActivityMiddleware('Fetching directory'), NFS.getDirectory);
router.delete('/nfs/directory/:rootPath/*', new ActivityMiddleware('Deleting directory'), NFS.deleteDirectory);
router.put('/nfs/directory/:rootPath/*', new ActivityMiddleware('Updating directory'), NFS.modifyDirectory);
router.post('/nfs/movedir', new ActivityMiddleware('Move/Copy Directory'), NFS.moveDirectory);

// NFS - FILE API
router.post('/nfs/file/:rootPath/*', new ActivityMiddleware('Creating file'), NFS.createFile);
router.delete('/nfs/file/:rootPath/*', new ActivityMiddleware('Deleting file'), NFS.deleteFile);
router.put('/nfs/file/metadata/:rootPath/*', new ActivityMiddleware('Updating file metadata'), NFS.modifyFileMeta);
router.put('/nfs/file/:rootPath/*', new ActivityMiddleware('Updating file'), NFS.modifyFileContent);
router.get('/nfs/file/:rootPath/*', new ActivityMiddleware('Reading file'), NFS.getFile);
router.head('/nfs/file/:rootPath/*', new ActivityMiddleware('Fetching file metadata'), NFS.getFileMetadata);
router.post('/nfs/movefile', new ActivityMiddleware('Move/Copy file'), NFS.moveFile);

// DNS API
router.post('/dns',new ActivityMiddleware('Register a long name and service'), DNS.register);
router.post('/dns/:longName', new ActivityMiddleware('Create long name'), DNS.createPublicId);
router.put('/dns', new ActivityMiddleware('Add a new service'), DNS.addService);
router.delete('/dns/:longName', new ActivityMiddleware('Delete a DNS Record'), DNS.deleteDns);
router.delete('/dns/:serviceName/:longName', new ActivityMiddleware('Delete a service'), DNS.deleteService);
router.get('/dns/:serviceName/:longName', new ActivityMiddleware('Get DNS home directory'), DNS.getHomeDirectory);
router.get('/dns/:serviceName/:longName/*', new ActivityMiddleware('Read public file'), DNS.getFile);
router.get('/dns', new ActivityMiddleware('List long names'), DNS.listLongNames);
router.get('/dns/:longName', new ActivityMiddleware('List services'), DNS.listServices);

export { router as router_0_5 };
