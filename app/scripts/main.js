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
.run([ '$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams) {
  $rootScope.$state = $state;
  $rootScope.isAuthenticated = false;
  $rootScope.authRequest = {
    status: false,
    data: {},
    confirm: function() {},
    show: function(data) {
      this.status = true;
      this.data = data;
    },
    hide: function() {
      this.status = false;
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

  window.msl.setNetworkStateChangeListener(function(state) {
    $rootScope.$networkStatus.show = true;
    $rootScope.$networkStatus.status = state;
    // if (state === window.NETWORK_STATE.DISCONNECTED) {
    //   $rootScope.$state.go('login');
    //   $rootScope.$msAlert.show('Network Disconnected', $rootScope.network.messages.DISCONNECTED, function() {});
    // }
    console.log('Network status :: ' + state);
    $rootScope.$applyAsync();
  });

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
