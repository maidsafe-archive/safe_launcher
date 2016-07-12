/**
 * @name safeLauncher
 * @description
 * SAFE launcher - gateway to the SAFE Network
 *
 * Main module of the application.
 */
window.safeLauncher = angular
  .module('safeLauncher', [ 'ui.router', 'react' ])
  .config([ '$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }
])
.run([ '$rootScope', '$state', '$stateParams', '$timeout', '$interval', 'CONSTANTS',
  function($rootScope, $state, $stateParams, $timeout, $interval, CONSTANTS) {
    $rootScope.$state = $state;
    $rootScope.keys = Object.keys;
    $rootScope.isAuthenticated = false;
    $rootScope.currentAppDetails = null;
    $rootScope.appList = {};
    $rootScope.logList = {};
    $rootScope.intervals = [];
    $rootScope.dashData = {
      accountInfo: {
        used: 0,
        available: 0
      },
      getsCount: 0,
      deletesCount: 0,
      postsCount: 0,
      putsCount: 0,
      unAuthGET: [],
      upload: 0,
      download: 0,
      authHTTPMethods: []
    };
    $rootScope.ALERT_TYPE = {
      AUTH_REQ: 'auth_request',
      TOASTER: 'toaster',
      PROMPT: 'prompt'
    };
    $rootScope.$alert = {
      queue: [],
      isProcessing: false,
      currentAlert: null,
      type: null,
      payload: {},
      timer: null,
      callback: function(err, data) {
        this.currentAlert.callback(err, data);
        this.type = null;
        this.payload = {};
        this.isProcessing = false;
        this.currentAlert = null;
        this.process();
      },
      show: function(type, payload, callback) {
        this.queue.push({
          type: type,
          payload: payload,
          callback: callback
        });
        this.process();
      },
      process: function() {
        var self = this;
        if (this.isProcessing) {
          return;
        }
        this.currentAlert = this.queue.shift();
        if (!this.currentAlert) {
          return;
        }
        this.isProcessing = true;
        this.type = this.currentAlert.type;
        this.payload = this.currentAlert.payload;
        if (this.currentAlert.type === $rootScope.ALERT_TYPE.TOASTER && !this.currentAlert.payload.hasOption) {
          this.timer = $timeout(function() {
            $timeout.cancel(this.timer);
            self.callback(null, true);
          }, CONSTANTS.TOASTER_TIMEOUT);
        }
      }
    };
    $rootScope.$proxyServer = false;
    $rootScope.clearIntervals = function() {
      for (var i in $rootScope.intervals) {
        $interval.cancel($rootScope.intervals[i])
      }
      $rootScope.intervals = [];
    };
    $rootScope.$networkStatus = {
      status: window.NETWORK_STATE.CONNECTING,
      retry: function() {
        this.status = window.NETWORK_STATE.RETRY;
        window.msl.reconnect();
      }
    };
    $rootScope.showNetworkStatus = function(status) {
      var nwStatusMsg = {
        0: 'Connecting to SAFE Network',
        1: 'Connected to SAFE Network',
        2: 'Connection to SAFE Network Disconnected'
      };
      var isError = (status === window.NETWORK_STATE.DISCONNECTED);
      $rootScope.$alert.show($rootScope.ALERT_TYPE.TOASTER, {
        msg: nwStatusMsg[status],
        hasOption: false,
        isError: isError
      }, function(err, data) {
        // server.reconnectNetwork();
      });
    };
  }
]);
