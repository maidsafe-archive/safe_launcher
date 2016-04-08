/**
 * Router
 */
window.safeLauncher.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise(function($injector, $location) {
    var state = $injector.get('$state');
    state.go('login', { userLogged: false });
    return $location.path();
  });
  $stateProvider
  .state('login', {
      url: '/login?userLogged',
      templateUrl: 'views/auth/login.html'
    })
  .state('register', {
    url: '/register?userLogged',
    templateUrl: 'views/auth/register.html'
  })
  .state('user', {
    url: '/user?userLogged',
    templateUrl: 'views/user/base.html'
  });
});
