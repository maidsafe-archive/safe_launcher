var should = require('should');
var utils = require('./test_utils');

describe("DNS", function() {
  var dirPath = '/test_' + (new Date().getTime());
  before(function(done) {
    var createDirCb = function(status) {
      if (status !== 200) {
        console.log('Unable to create directory: ' + status);
        return process.exit(0);
      }
      done();
    };

    var authoriseCb = function(status) {
      if (status !== 200) {
        console.log('Unable to authorise: ' + status);
        return process.exit(0);
      }
      utils.createDir(utils.getToken(), dirPath, createDirCb);
    };
    var startLauncherCb = function() {
      utils.registerAuthApproval(true);
      utils.authoriseApp(authoriseCb);
    };
    var loginCb = function() {
      utils.startLauncher(startLauncherCb);
    };
    utils.register(function(regKeys) {
      utils.setRegisteredKeys(regKeys);
      utils.login(true, loginCb);
    });
  });

  after(function(done) {
    utils.removeAllEventListener();
    var revokeAppCb = function(status) {
      utils.killLauncher();
      if (status === 200) {
        done();
      }
    };
    var deleteDirCb = function(status) {
      if (status !== 200) {
        console.log('Unable to delete directory: ' + status);
        process.exit(0);
      }
      utils.revokeApp(utils.getToken(), revokeAppCb);
    };
    utils.deleteDir(utils.getToken(), encodeURIComponent(dirPath), deleteDirCb);
  });

  describe('Register DNS', function() {
    var longName = 'long' + (new Date().getTime());
    var serviceName = 'service' + (new Date().getTime());

    after(function(done) {
      utils.deleteDns(utils.getToken(), longName, function(status) {
        if (status !== 200) {
          console.log('Unable to delete DNS: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to register DNS', function(done) {
      utils.registerDns(utils.getToken(), longName, serviceName, dirPath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw unauthorised 401', function(done) {
      utils.registerDns(Math.floor(Math.random() * 1000000000), longName, serviceName, dirPath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 directory path not found', function(done) {
      utils.registerDns(utils.getToken(), longName, serviceName, ('/test_' + (new Date().getTime())), function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });

  // create public id
  describe('Create public ID', function() {
    var longName = 'long' + (new Date().getTime());

      after(function(done) {
        utils.deleteDns(utils.getToken(), longName, function(status) {
          if (status !== 200) {
            console.log('Unable to delete DNS: ' + status);
            return process.exit(0);
          }
          done();
        });
      });

    it('should be able to create public id', function(done) {
      utils.createPublicId(utils.getToken(), longName, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw unauthorised 401', function(done) {
      utils.createPublicId(Math.floor(Math.random() * 1000000000), longName, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });
  });

  // Add service
  describe('Add service', function() {
    var longName = 'long' + (new Date().getTime());
    var serviceName = 'service' + (new Date().getTime());

    before(function(done) {
      utils.createPublicId(utils.getToken(), longName, function(status) {
        if (status !== 200) {
          console.log('Unable to create DNS: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    after(function(done) {
      utils.deleteDns(utils.getToken(), longName, function(status) {
        if (status !== 200) {
          console.log('Unable to delete DNS: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to add service', function(done) {
      utils.addService(utils.getToken(), longName, serviceName, dirPath, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw unauthorised 401', function(done) {
      utils.addService(Math.floor(Math.random() * 1000000000), longName, serviceName, dirPath, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 directory path not found', function(done) {
      utils.addService(utils.getToken(), longName, serviceName, ('/test_' + (new Date().getTime())), function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });

  // Delete DNS
  describe('Delete DNS', function() {
    var longName = 'long' + (new Date().getTime());

    before(function(done) {
      utils.createPublicId(utils.getToken(), longName, function(status) {
        if (status !== 200) {
          console.log('Unable to create DNS: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to delete DNS', function(done) {
      utils.deleteDns(utils.getToken(), longName, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw unauthorised 401', function(done) {
      utils.deleteDns(Math.floor(Math.random() * 1000000000), longName, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 directory path not found', function(done) {
      utils.deleteDns(utils.getToken(), ('/test_' + (new Date().getTime())), function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });

  // Delete Services
  // describe('Delete Services', function() {
  //   var longName = 'long' + (new Date().getTime());
  //   var serviceName = 'service' + (new Date().getTime());
  //
  //   before(function(done) {
  //     utils.registerDns(utils.getToken(), longName, serviceName, dirPath, function(status) {
  //       if (status !== 200) {
  //         console.log('Unable to create DNS: ' + status);
  //         return process.exit(0);
  //       }
  //       done();
  //     });
  //   });
  //
  //   after(function(done) {
  //     utils.deleteDns(utils.getToken(), longName, function(status) {
  //       if (status !== 200) {
  //         console.log('Unable to delete DNS: ' + status);
  //         return process.exit(0);
  //       }
  //       done();
  //     });
  //   });
  //
  //   it('should be able to delete service', function(done) {
  //     utils.deleteService(utils.getToken(), longName, serviceName, function(status) {
  //       (status).should.be.equal(200);
  //       done();
  //     });
  //   });
  //
  //   it('should throw unauthorised 401', function(done) {
  //     utils.deleteService(Math.floor(Math.random() * 1000000000), longName, serviceName, function(status) {
  //       (status).should.be.equal(401);
  //       done();
  //     });
  //   });
  //
  //   it('should throw 400 directory path not found', function(done) {
  //     utils.deleteService(utils.getToken(), ('/test_' + (new Date().getTime())), serviceName, function(status) {
  //       (status).should.be.equal(400);
  //       done();
  //     });
  //   });
  // });

  // Get home directory
  describe('Get home directory', function() {
    var longName = 'long' + (new Date().getTime());
    var serviceName = 'service' + (new Date().getTime());

    before(function(done) {
      utils.registerDns(utils.getToken(), longName, serviceName, dirPath, function(status) {
        if (status !== 200) {
          console.log('Unable to create DNS: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    after(function(done) {
      utils.deleteDns(utils.getToken(), longName, function(status) {
        if (status !== 200) {
          console.log('Unable to delete DNS: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to get home directory', function(done) {
      utils.getHomeDir(utils.getToken(), longName, serviceName, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw unauthorised 401', function(done) {
      utils.getHomeDir(Math.floor(Math.random() * 1000000000), longName, serviceName, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    // it('should throw 400 directory path not found', function(done) {
    //   utils.getHomeDir(utils.getToken(), ('/test_' + (new Date().getTime())), serviceName, function(status) {
    //     (status).should.be.equal(404);
    //     done();
    //   });
    // });
  });

  //  Get file path
  // describe('Get File Path', function() {
  //   var longName = 'long' + (new Date().getTime());
  //   var serviceName = 'service' + (new Date().getTime());
  //   var filePath = dirPath + '/testfile.txt';
  //
  //   before(function(done) {
  //     var createFileCb = function(status) {
  //       if (status !== 200) {
  //         console.log('Unable to create file : ' + status);
  //         return process.exit(0);
  //       }
  //       done();
  //     };
  //
  //     var registerDnsCb = function(status) {
  //       if (status !== 200) {
  //         console.log('Unable to create DNS: ' + status);
  //         return process.exit(0);
  //       }
  //       utils.createFile(utils.getToken(), filePath, createFileCb);
  //     };
  //     utils.registerDns(utils.getToken(), longName, serviceName, dirPath, registerDnsCb);
  //   });
  //
  //   after(function(done) {
  //     var deleteDnsCb = function(status) {
  //       if (status !== 200) {
  //         console.log('Unable to delete DNS: ' + status);
  //         return process.exit(0);
  //       }
  //       done();
  //     };
  //
  //     var deleteFileCb = function(status) {
  //       if (status !== 200) {
  //         console.log('Unable to delete file : ' + status);
  //         return process.exit(0);
  //       }
  //       utils.deleteDns(utils.getToken(), longName, deleteDnsCb);
  //     };
  //     utils.deleteFile(utils.getToken(), filePath, deleteFileCb);
  //   });
  //
  //   it('should be able to get file path', function(done) {
  //     utils.getFilePath(utils.getToken(), longName, serviceName, filePath, function(status) {
  //       (status).should.be.equal(200);
  //       done();
  //     });
  //   });
  //
  //   it('should throw unauthorised 401', function(done) {
  //     utils.getFilePath(Math.floor(Math.random() * 1000000000), longName, serviceName, filePath, function(status) {
  //       (status).should.be.equal(401);
  //       done();
  //     });
  //   });
  //
  //   it('should throw 400 DNS not found', function(done) {
  //     utils.getFilePath(utils.getToken(), ('/test_' + (new Date().getTime())), serviceName, filePath, function(status) {
  //       (status).should.be.equal(404);
  //       done();
  //     });
  //   });
  // });

  // get long names
  describe('Get Long Names', function() {
    it('should be able to get all long names', function(done) {
      utils.getLongNames(utils.getToken(), function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw unauthorised 401', function(done) {
      utils.getLongNames(Math.floor(Math.random() * 1000000000), function(status) {
        (status).should.be.equal(401);
        done();
      });
    });
  });

  // get services
  describe('Get Services', function() {
    var longName = 'long' + (new Date().getTime());
    var serviceName = 'service' + (new Date().getTime());

    before(function(done) {
      utils.registerDns(utils.getToken(), longName, serviceName, dirPath, function(status) {
        if (status !== 200) {
          console.log('Unable to create DNS: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    after(function(done) {
      utils.deleteDns(utils.getToken(), longName, function(status) {
        if (status !== 200) {
          console.log('Unable to delete DNS: ' + status);
          return process.exit(0);
        }
        done();
      });
    });

    it('should be able to get service list', function(done) {
      utils.getServices(utils.getToken(), longName, function(status) {
        (status).should.be.equal(200);
        done();
      });
    });

    it('should throw unauthorised 401', function(done) {
      utils.getServices(Math.floor(Math.random() * 1000000000), longName, function(status) {
        (status).should.be.equal(401);
        done();
      });
    });

    it('should throw 404 DNS not found', function(done) {
      utils.getServices(utils.getToken(), ('/test_' + (new Date().getTime())), function(status) {
        (status).should.be.equal(404);
        done();
      });
    });
  });
});
