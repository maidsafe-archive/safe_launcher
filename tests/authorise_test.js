var should = require('should');
var utils = require('./test_utils');
var fork = require('child_process').fork;
var request = require('request');

describe('Authorisation', function() {
  var child = null;

  before(function(done) {
    var config = require('../config/env_development.json');
    utils.startLauncher(function() {
      done();
    });
  });

  after(function() {
    utils.killLauncher();
  });

  describe('Authorise App', function() {
    it('should be able to authorise app', function(done) {

    });
  });

});
