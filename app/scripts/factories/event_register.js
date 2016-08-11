/**
 * Authentication Factory
 */
window.safeLauncher.factory('eventRegistrationFactory', [ '$rootScope', 'serverFactory', 'CONSTANTS',
  function($rootScope, server, CONSTANTS) {
    var factory = this;
    factory.appList = {};

    var onAuthRequest = function() {
      var ConfirmationQueue = function() {
        var requestQueue = [];
        var isAuthReqProcessing = false;

        var showPrompt = function(appData, callback) {
          $rootScope.$authReq.show(appData, function(err, status) {
            server.confirmResponse(appData, status);
            if (status) {
              $rootScope.$loader.show('Preparing application root directory.');
            }
            callback();
          });
          $rootScope.$applyAsync();
        };

        var show = function() {
          if (isAuthReqProcessing || requestQueue.length === 0) {
            return;
          }
          isAuthReqProcessing = true;

          var run = function() {
            showPrompt(requestQueue.shift(), function() {
              if (requestQueue.length === 0) {
                isAuthReqProcessing = false;
                return;
              }
              run();
            });
          };
          run();
        };

        this.push = function(data) {
          requestQueue.push(data);
          show();
        };
        return this;
      };

      var queue = new ConfirmationQueue();

      // handle auth request
      server.onAuthRequest(function(data) {
        if (!$rootScope.isAuthenticated) {
          return server.confirmResponse(data, false);
        }
        server.focusWindow();
        queue.push(data);
      });
    };

    var apiServerEvents = function() {
      // handle server error
      server.onServerError(function(err) {
        // TODO show loader
        $rootScope.$prompt.show({
          title: 'Server Error',
          msg: err.message
        }, function(err, data) {
          server.closeWindow();
        });
      });

      // handle server start
      server.onServerStarted(function() {
        console.log('Server started');
      });

      // handle server shutdown
      server.onServerShutdown(function() {
        // $rootScope.$loader.hide();
        console.log('Server Stopped');
      });
    };

    var proxyServerEvents = function() {
      // handle proxy start
      server.onProxyStart(function(msg) {
        $rootScope.$proxyServer = true;
        $rootScope.setProxy(true);
      });

      // handle proxy stop
      server.onProxyExit(function(msg) {
        // $rootScope.$loader.hide();
        $rootScope.$proxyServer = false;
      });

      // handle proxy error
      server.onProxyError(function(err) {
        $rootScope.setProxy(false);
        $rootScope.$proxyServer = false;
        $rootScope.$toaster.show({
          msg: err.message,
          hasOption: false,
          isError: true
        }, function() {});
      });
    };

    var dataTransferEvents = function() {
      server.onUploadEvent(function(data) {
        if (!data) {
          return;
        }
        $rootScope.dashData.upload += data;
        $rootScope.$applyAsync();
      });

      server.onDownloadEvent(function(data) {
        if (!data) {
          return;
        }
        $rootScope.dashData.download += data;
        $rootScope.$applyAsync();
      });
    };

    factory.logList = [];
    factory.appLastLog = {};
    factory.currentAppDetails = null;

    var activityEvents = function() {
      var updateActivity = function(data, isNew) {
        data.activity.appName = data.appName || 'Anonymous Application';
        if (isNew) {
          if (factory.logList.length >= CONSTANTS.LOG_LIST_LIMIT) {
            factory.logList.pop();
          }
        } else {
          var activityIndex = factory.logList.map(function(obj) {
            return obj.activityId;
          }).indexOf(data.activity.activityId);
          factory.logList.splice(activityIndex, 1);
        }
        factory.logList.unshift(data.activity);
        if (factory.currentAppDetails) {
          if (!isNew) {
            var currentAppLogIndex = factory.currentAppDetails.logs.map(function(obj) {
              return obj.activityId;
            }).indexOf(data.activity.activityId);
            factory.currentAppDetails.logs.splice(currentAppLogIndex, 1);
          }
          factory.currentAppDetails.logs.unshift(data.activity);
        }
        if (data.app && factory.appList[data.app]) {
          factory.appList[data.app].status = data.activity;
        } else if (!factory.appList[data.app]) {
          delete factory[data.app];
        }
        $rootScope.logListComponent.update(factory.currentAppDetails ?
          factory.currentAppDetails.logs : factory.logList);
      };

      server.onNewAppActivity(function(data) {
        if (!data) {
          return;
        }
        setTimeout(function() {
          updateActivity(data, true);
        }, 1);
      });

      server.onUpdatedAppActivity(function(data) {
        if (!data) {
          return;
        }
        setTimeout(function() {
          updateActivity(data, false);
        }, 1);
      });
    };

    var appSessionEvents = function() {
      var removeApplication = function(id) {
        for (var i in factory.appList) {
          if (factory.appList[i].id === id) {
            delete factory.appList[i];
            break;
          }
        }
      };

      // handle session creation
      server.onSessionCreated(function(session) {
        console.log('Session created :: ');
        factory.appList[session.id] = {
          id: session.id,
          name: session.info.appName,
          version: session.info.appVersion,
          vendor: session.info.vendor,
          permissions: session.info.permissions.list,
          status: {
            beginTime: new Date(),
            activityName: 'Authorisation',
            activityStatus: 1
          },
          lastActive: window.moment().fromNow()
        };
        $rootScope.$loader.hide();
        $rootScope.$applyAsync();
      });

      window.msl.onSessionCreationFailed(function() {
        $rootScope.$loader.hide();
        $rootScope.$applyAsync();
      });

      // handle session removed
      server.onSessionRemoved(function(id) {
        console.log('Session removed :: ' + id);
        $rootScope.$toaster.show({
          msg: 'Revoked access ' + (factory.appList[id] ? ('for ' + factory.appList[id].name) : ''),
          hasOption: false,
          isError: false
        }, function(err, data) {
          console.log('Revoked application');
        });
        removeApplication(id);
      });
    };

    this.init = function() {
      apiServerEvents();
      proxyServerEvents();
      activityEvents();
      onAuthRequest();
      dataTransferEvents();
      appSessionEvents();
    };

    return this;
  }
]);
