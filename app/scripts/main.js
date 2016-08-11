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
.run([ '$rootScope', '$state', '$stateParams', '$timeout', '$interval', 'CONSTANTS', 'logListComponent',
  function($rootScope, $state, $stateParams, $timeout, $interval, CONSTANTS, logListComponent) {
    $rootScope.$state = $state;
    $rootScope.userInfo = {};
    $rootScope.user = {};
    $rootScope.keys = Object.keys;
    $rootScope.appVersion = require('./package.json').version;
    $rootScope.ACCOUNT_STATES = [ 'login', 'register', 'authIntro' ];
    $rootScope.accountLastState = null;
    $rootScope.$loader = {
      status: false,
      description: '',
      show: function(description) {
        this.status = true;
        this.description = description || '';
      },
      hide: function() {
        this.status = false;
        this.description = '';
      }
    };
    $rootScope.logListComponent = logListComponent;
    $rootScope.resetAppStates = function() {
      $rootScope.isAuthenticated = false;
      $rootScope.isAuthLoading = false;
      // $rootScope.currentAppDetails = {
      //   logs: []
      // };
      // $rootScope.appList = {};
      // $rootScope.logList = [];
      $rootScope.intervals = [];
      $rootScope.retryCount = 1;
    };

    $rootScope.resetStats = function() {
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
    };

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if ($rootScope.isAuthLoading) {
        event.preventDefault();
        return;
      }
      // clear user data when state from 'login' to 'register'
      if (toState.name === 'app.account') {
        if ((!fromParams.currentPage || fromParams.currentPage === 'login') && (toParams.currentPage === 'register')) {
          $rootScope.user = {};
          toParams.currentState = null;
        }
      }
      if (fromState.name === 'app.account' && toState.name !== 'app.account') {
        if (fromParams.currentPage && ($rootScope.ACCOUNT_STATES.indexOf(fromParams.currentPage) !== -1)) {
          $rootScope.accountLastState = fromParams;
        }
      }
      if (fromState.name !== 'app.account' && toState.name === 'app.account') {
        if ($rootScope.accountLastState) {
          toParams.currentPage = $rootScope.accountLastState.currentPage || toParams.currentPage;
          toParams.currentState = $rootScope.accountLastState.currentState || toParams.currentState;
        }
      }
      if ((toState.name === 'app.account') && (toParams.currentPage === 'login')) {
        $rootScope.user = {};
        toParams.currentState = null;
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
      this.queue.push({ payload: payload, callback: callback });
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
        $interval.cancel($rootScope.intervals[i]);
      }
      $rootScope.intervals = [];
    };
    $rootScope.$networkStatus = {
      status: window.NETWORK_STATE.CONNECTING
      // retry: function() {
      //   this.status = window.NETWORK_STATE.CONNECTING;
      //   window.msl.reconnect();
      // }
    };
    $rootScope.networkStatusMsg = {
      0: 'Connecting to SAFE Network',
      1: 'Connected to SAFE Network',
      2: 'Connection to SAFE Network Disconnected'
    };
    $rootScope.showNetworkStatus = function(status) {
      var isError = (status === window.NETWORK_STATE.DISCONNECTED);
      $rootScope.$toaster.show({
        msg: $rootScope.networkStatusMsg[status],
        hasOption: false,
        isError: isError
      }, function(err, data) {});
    };

    $rootScope.resetAppStates();
    $rootScope.resetStats();
  }
]);
