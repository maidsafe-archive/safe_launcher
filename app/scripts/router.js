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
    'url': '/app?:isFirstLogin?',
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
    'url': '/account?:currentPage',
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
  .state('app.activity', {
    'url': '/activity',
    'views': {
      'tab': {
        'templateUrl': 'views/tab/activity.html'
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
});
