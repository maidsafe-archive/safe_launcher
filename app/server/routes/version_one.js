import express from 'express';
import * as NFS from '../controllers/nfs';
import * as Auth from '../controllers/auth';
import { setSessionIdHeader } from '../utils';

var router = express.Router();
router.post('/auth', Auth.authorise);
router.delete('/auth', Auth.revoke);
router.get('/nfs/directory', setSessionIdHeader, NFS.createDirectory);
router.delete('/nfs/directory/:dirPath/:isPathShared', setSessionIdHeader, NFS.createDirectory);

export { router as versionOneRouter };
