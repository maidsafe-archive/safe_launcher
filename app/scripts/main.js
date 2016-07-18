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
    $rootScope.userInfo = {};
    $rootScope.keys = Object.keys;
    $rootScope.isAuthenticated = false;
    $rootScope.isAuthLoading = false;
    $rootScope.currentAppDetails = null;
    $rootScope.appVersion = require('./package.json').version;
    $rootScope.appList = {};
    $rootScope.logList = {};
    $rootScope.intervals = [];
    $rootScope.retryCount = 1;
    $rootScope.dashData = {
      accountInfo: {
        used: 0,
        available: 0
      },
      accountInfoLoading: false,
      accountInfoTime: new Date(),
      accountInfoTimeString: window.moment().fromNow(),
      accountInfoUpdateEnabled: true,
      accountInfoUpdateTimeLeft: '00:00',
      getsCount: 0,
      deletesCount: 0,
      postsCount: 0,
      putsCount: 0,
      unAuthGET: [],
      upload: 0,
      download: 0,
      authHTTPMethods: []
    };
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if ($rootScope.isAuthLoading) {
        event.preventDefault();
        return;
      }
    });
    var Queuing = function() {
      this.queue = [];
      this.isProcessing = false;
      this.currentObject = null;
      this.payload = null;
    };
    Queuing.prototype.reset = function() {
      this.isProcessing = false;
      this.currentObject = null;
      this.payload = null;
    };
    Queuing.prototype.callback = function(err, data) {
      var self = this;
      if (!this.currentObject) {
        return;
      }
      this.currentObject.callback(err, data);
      this.reset();
      $timeout(function() {
        self.process();
      }, 500);
    };
    Queuing.prototype.show = function(payload, callback) {
      this.queue.push({payload: payload, callback: callback});
      this.process();
    };
    Queuing.prototype.process = function() {
      if (this.isProcessing) {
        return;
      }
      this.currentObject = this.queue.shift();
      if (!this.currentObject) {
        return;
      }
      this.isProcessing = true;
      this.payload = this.currentObject.payload;
      $rootScope.$applyAsync();
    };
    $rootScope.$toaster = new Queuing();
    $rootScope.$prompt = new Queuing();
    $rootScope.$authReq = new Queuing();
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
        this.status = window.NETWORK_STATE.CONNECTING;
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
      $rootScope.$toaster.show({
        msg: nwStatusMsg[status],
        hasOption: false,
        isError: isError
      }, function(err, data) {});
    };
  }
]);
