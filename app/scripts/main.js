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
  $rootScope.$proxyServer = false;
  $rootScope.openExternal = function(link) {
    var shell = require('electron').shell;
    shell.openExternal(link.toString());
  };
} ]);
