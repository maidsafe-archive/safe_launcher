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
  $rootScope.isAuthenticated = false;
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
        }, 2000);
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

  // $rootScope.$stateParams = $stateParams;
  // $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, options) {
  //   event.preventDefault();
  //   if (toState.name !== 'login' && toState.name !== 'register') {
  //     $rootScope.isAuthenticated = true;
  //   }
  // });
  // $rootScope.$loader = {
  //   isLoading: false,
  //   show: function() {
  //     this.isLoading = true;
  //   },
  //   hide: function() {
  //     this.isLoading = false;
  //     if (!$rootScope.$$phase) {
  //       $rootScope.$apply();
  //     }
  //   }
  // };
  // $rootScope.$msAlert = {
  //   status: false,
  //   callback: function() {},
  //   title: null,
  //   body: null,
  //   show: function(title, body, callback) {
  //     this.status = true;
  //     this.title = title;
  //     this.body = body;
  //     this.callback = callback;
  //   },
  //   hide: function() {
  //     this.status = false;
  //     this.title = null;
  //     this.body = null;
  //     this.callback();
  //   }
  // };
  // $rootScope.$proxyServer = false;
  // $rootScope.openExternal = function(link) {
  //   var shell = require('electron').shell;
  //   shell.openExternal(link.toString());
  // };

  // window.msl.setNetworkStateChangeListener(function(state) {
  //   $rootScope.network.show = true;
  //   $rootScope.network.status = state;
  //   if (state === window.NETWORK_STATE.DISCONNECTED) {
  //     $rootScope.$state.go('login');
  //     $rootScope.$msAlert.show('Network Disconnected', $rootScope.network.messages.DISCONNECTED, function() {});
  //   }
  //   $rootScope.$applyAsync();
  //   console.log($rootScope.network);
  // });
} ]);
