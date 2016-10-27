import axios from 'axios';
import crypto from 'crypto';
import { loadLibrary } from '../app/ffi/loader';
import auth from '../app/ffi/api/auth';
import RESTServer from '../app/server/boot';
import config from '../config/env_test.json';

class MockApp {
  constructor() {
    this.config = config;
    loadLibrary();
    this.server = new RESTServer(this.config.serverPort);
    this.server.start();
    this.axios = axios.create({
      baseURL: `http://localhost:${this.config.serverPort}/`
    });
    this.authorizationToken = null;
  }

  registerAuthorisationListener(callback) {
    this.server.addEventListener(this.server.EVENT_TYPE.AUTH_REQUEST, callback);
  }

  onAppAuthorised(callback) {
    this.server.addEventListener(this.server.EVENT_TYPE.SESSION_CREATED, callback);
  }

  removeAuthReqEvent() {
    this.server.removeAllEventListener(this.server.EVENT_TYPE.AUTH_REQUEST);
  }

  removeSessionCreatedEvent() {
    this.server.removeAllEventListener(this.server.EVENT_TYPE.SESSION_CREATED);
  }

  removeAuthoriseEventListener() {
    this.server.removeAllEventListener(this.server.EVENT_TYPE.AUTH_REQUEST);
    this.server.removeAllEventListener(this.server.EVENT_TYPE.SESSION_CREATED);
  }

  getUnregisteredClient() {
    auth.getUnregisteredSession().should.be.fulfilled();
  }

  registerRandomUser() {
    const locator = crypto.randomBytes(20).toString('hex');
    const secret = crypto.randomBytes(20).toString('hex');
    return auth.register(locator, secret);
  }

  approveAppAuthorisation(app) {
    this.server.authApproved(app);
  }

  rejectAppAuthorisation(app) {
    this.server.authRejected(app);
  }

  get authToken() {
    return this.authorizationToken;
  }

  set authToken(token) {
    this.authorizationToken = token;
  }

}

const mockApp = new MockApp();
export default mockApp;
