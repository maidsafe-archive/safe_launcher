import express from 'express';
import AuthController from '../controllers/auth';

export default class VersionOneRouter {
  constructor(api) {
    this.api = api;
    this.router = express.Router();
  }

  getRouter() {
    var authController = new AuthController(this.api);    

    this.router.get('/auth', authController.authorise);

    return this.router;
  }
};
