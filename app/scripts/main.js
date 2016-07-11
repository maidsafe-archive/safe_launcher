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
.run([ '$rootScope', '$state', '$stateParams', '$timeout', function($rootScope, $state, $stateParams, $timeout) {
  $rootScope.$state = $state;
  $rootScope.keys = Object.keys;
  $rootScope.isAuthenticated = false;
  $rootScope.currentAppDetails = null;
  $rootScope.appList = {};
  $rootScope.logList = {};
  $rootScope.dashData = {
    getsCount: 0,
    deletesCount: 0,
    postsCount: 0,
    unAuthGET: 0,
    upload: 0,
    download: 0,
    authHTTPMethods: {
      POST: 0,
      GET: 0,
      PUT: 0,
      DELETE: 0
    }
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
        }, 5000);
      }
    }
  };
  $rootScope.$proxyServer = false;
  $rootScope.$networkStatus = {
    status: window.NETWORK_STATE.CONNECTING,
    retry: function() {
      this.status = window.NETWORK_STATE.RETRY;
      window.msl.reconnect();
    }
  };
} ]);
