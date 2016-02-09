import express from 'express';
import * as NFS from '../controllers/nfs';
import * as Auth from '../controllers/auth';

var router = express.Router();
router.post('/auth', Auth.authorise);
router.delete('/auth', Auth.revoke);
router.post('/nfs/directory', NFS.createDirectory);
router.get('/nfs/directory', NFS.getDirectory);

export { router as versionOneRouter };
