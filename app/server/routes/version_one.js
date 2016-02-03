import express from 'express';
import * as Auth from '../controllers/auth';

var versionOneRouter;
var router = express.Router();
router.post('/auth', Auth.authorise);

export default versionOneRouter = router;
