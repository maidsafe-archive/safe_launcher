/**
 * @name safeLauncher
 * @description
 * SAFE launcher - gateway to the SAFE Network
 *
 * Main module of the application.
 */
window.safeLauncher = angular
  .module('safeLauncher', [ 'ui.router' ])
  .config([ '$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }
])
.run([ '$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  $rootScope.isAuthenticated = false;
  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, options) {
    event.preventDefault();
    if (toState.name !== 'login' && toState.name !== 'register') {
      $rootScope.isAuthenticated = true;
    }
  });
  $rootScope.$loader = {
    isLoading: false,
    show: function() {
      this.isLoading = true;
    },
    hide: function() {
      this.isLoading = false;
      if (!$rootScope.$$phase) {
        $rootScope.$apply();
      }
    }
  };
  $rootScope.$msAlert = {
    status: false,
    callback: function() {},
    title: null,
    body: null,
    show: function(title, body, callback) {
      this.status = true;
      this.title = title;
      this.body = body;
      this.callback = callback;
    },
    hide: function() {
      this.status = false;
      this.title = null;
      this.body = null;
      this.callback();
    }
  };
  $rootScope.$proxyServer = false;
  $rootScope.openExternal = function(link) {
    var shell = require('electron').shell;
    shell.openExternal(link.toString());
  };
  $rootScope.network = {
    status: window.NETWORK_STATE.CONNECTING,
    show: true,
    messages: {
      'CONNECTED': 'Connected to the SAFE Network',
      'CONNECTING': 'Trying to connect with SAFE Network',
      'DISCONNECTED': 'Can\'t reach the SAFE Network',
      'RETRY': 'Retrying connection...'
    },
    hide: function() {
      this.show = false;
    },
    retry: function() {
      this.status = window.NETWORK_STATE.RETRY;
      window.msl.reconnect();
    }
  };
  window.msl.setNetworkStateChangeListener(function(state) {
    $rootScope.network.show = true;
    $rootScope.network.status = state;
    if (state === window.NETWORK_STATE.DISCONNECTED) {
      $rootScope.$msAlert.show('Network Disconnected', $rootScope.network.messages.DISCONNECTED, function() {});
    }
    $rootScope.$applyAsync();
    console.log($rootScope.network);
  });
} ]);
