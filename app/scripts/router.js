/**
 * Router
 */
window.safeLauncher.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('login');
  $stateProvider
  .state('login', {
      url: '/login',
      templateUrl: 'views/auth/login.html'
    })
  .state('register', {
    url: '/register',
    templateUrl: 'views/auth/register.html'
  });
});
