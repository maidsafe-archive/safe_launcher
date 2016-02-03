import express from 'express';
import { authorise } from '../controllers/auth';

var versionOneRouter;
var router = express.Router();
router.post('/auth', authorise);

export default versionOneRouter = router;
