import express from 'express';
import AuthController from '../controllers/auth';

export default class VersionOneRouter {
  constructor(api) {
    this.api = api;
    this.router = express.Router();
  }

  getRouter() {
    var authController = new AuthController(this.api);
    authController.register(this.router);
    return this.router;
  }
};
