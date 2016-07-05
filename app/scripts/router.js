/**
 * Router
 */
window.safeLauncher.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('app');
  $stateProvider
  .state('splash', {
    'url': '/splash',
    'views': {
      'root': {
        'templateUrl': 'views/splash.html'
      }
    }
  })
  .state('app', {
    'url': '/app',
    'views': {
      'root': {
        'templateUrl': 'views/tab/base.html'
      },
      'tab@app': {
        'templateUrl': 'views/tab/account.html'
      }
    }
  })
  .state('app.account', {
    'url': '/account',
    'views': {
      'tab': {
        'templateUrl': 'views/tab/account.html'
      }
    }
  })
  .state('app.dashboard', {
    'url': '/dashboard',
    'views': {
      'tab': {
        'templateUrl': 'views/tab/dashboard.html'
      }
    }
  })
  .state('app.settings', {
    'url': '/settings',
    'views': {
      'tab': {
        'templateUrl': 'views/tab/settings.html'
      }
    }
  })
  .state('app.help', {
    'url': '/help',
    'views': {
      'tab': {
        'templateUrl': 'views/tab/help.html'
      }
    }
  })
  // .state('register', {
  //   url: '/register',
  //   templateUrl: 'views/auth/register.html'
  // })
  // .state('user', {
  //   url: '/user',
  //   templateUrl: 'views/user/base.html'
  // });
});
