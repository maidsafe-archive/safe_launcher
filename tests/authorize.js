/**
 * Application authirization test
 */
var should = require('should');
var utils = require('./utils');
var request = require('request');
import { remote } from 'electron';
import * as api from '../app/api/safe';
import RESTServer from '../app/server/boot';
import UIUtils from '../app/ui_utils';

describe('Authentication', function() {
  var restServer = null;
  var msl = null;
  before(function() {
    restServer = new RESTServer(api);
    msl = new UIUtils(api, utils.electronRemote, restServer);
    msl.startServer();
  });

  describe('Authorize', function() {
    it('Should be able to authorize successfully', function(done) {
      msl.onAuthRequest(function(data) {
        msl.authResponse(data, true);
      });
      utils.authorize(request, function(err, res, body) {
        should(err).be.null;
        should(res.statusCode).be.eql(200);
        restServer.removeAllEventListener(restServer.EVENT_TYPE.AUTH_REQUEST);
        done();
      });
    });
    it('Should throw 401 unauthorised', function(done) {
      msl.onAuthRequest(function(data) {
        msl.authResponse(data, false);
      });
      utils.authorize(request, function(err, res, body) {
        should(err).be.null;
        should(res.statusCode).be.eql(401);
        restServer.removeAllEventListener(restServer.EVENT_TYPE.AUTH_REQUEST);
        done();
      });
    });
  });
  describe('Revoke', function() {
    var payload = {
      "app": {
        "name": "Mozilla",
        "version": "0.0.1",
        "id": "com.sample",
        "vendor": "DEMO"
      },
      "permissions": [],
      "publicKey": "y4PQimgUkoaGdDTWmhgqxvXDZVluRlwCvUdgRibKUCA=",
      "nonce": "lVhti2zazoTTVgmOGkXq0wjnn+9fbjfW"
    };
    it('Should be able to revoke successfully', function(done) {
      msl.onAuthRequest(function(data) {
        msl.authResponse(data, true);
      });
      var authoriseCallback = function(err, res, body) {
        restServer.removeAllEventListener(restServer.EVENT_TYPE.AUTH_REQUEST);
        var req = {
          headers: {
            'content-type' : 'application/json',
            'Authorization': 'bearer ' + JSON.parse(body).token
          },
          url: 'http://localhost:3000/auth',
        };
        request.del(req, function(err, res, body) {
          should(err).be.null;
          should(res.statusCode).be.eql(200);
          restServer.removeAllEventListener(restServer.EVENT_TYPE.AUTH_REQUEST);
          done();
        });
      };
      utils.authorize(request, authoriseCallback);
    });
    it('Should throw 401 unauthorised', function(done) {
      msl.onAuthRequest(function(data) {
        msl.authResponse(data, true);
      });
      var authoriseCallback = function(err, res, body) {
        restServer.removeAllEventListener(restServer.EVENT_TYPE.AUTH_REQUEST);
        var req = {
          headers: {
            'content-type' : 'application/json',
            'Authorization': utils.genRandomString(10)
          },
          url: 'http://localhost:3000/auth',
        };
        request.del(req, function(err, res, body) {
          should(err).not.be.null;
          should(res.statusCode).be.eql(401);
          restServer.removeAllEventListener(restServer.EVENT_TYPE.AUTH_REQUEST);
          done();
        });
      };
      utils.authorize(request, authoriseCallback);
    });
    it('Should throw 400 Session not found', function(done) {
      msl.onAuthRequest(function(data) {
        msl.authResponse(data, true);
      });
      var authoriseCallback = function(err, res, body) {
        restServer.removeAllEventListener(restServer.EVENT_TYPE.AUTH_REQUEST);
        var req = {
          headers: {
            'content-type' : 'application/json',
            'Authorization': 'bearer ' + utils.genRandomString(10)
          },
          url: 'http://localhost:3000/auth',
        };
        request.del(req, function(err, res, body) {
          should(err).not.be.null;
          should(res.statusCode).be.eql(401);
          restServer.removeAllEventListener(restServer.EVENT_TYPE.AUTH_REQUEST);
          done();
        });
      };
      utils.authorize(request, authoriseCallback);
    });
  });
});
