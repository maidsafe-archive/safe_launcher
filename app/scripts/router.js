 /*global safeLauncher:false */
safeLauncher.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('register');
  $stateProvider
  .state('register', {
    url: '/register',
    templateUrl: 'views/auth/register.html'
  });
});
