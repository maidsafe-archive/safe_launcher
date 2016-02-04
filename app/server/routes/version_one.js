import express from 'express';
import { authorise } from '../controllers/auth';

var router = express.Router();
router.post('/auth', authorise);

export { router as versionOneRouter };
