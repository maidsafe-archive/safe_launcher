/**
 * Router
 */
window.safeLauncher.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('splash');
  $stateProvider
  .state('splash', {
    'url': '/splash',
    'views': {
      'root': {
        'templateUrl': 'views/splash.html'
      }
    }
  })
  .state('initProxy', {
    'url': '/init_proxy',
    'views': {
      'root': {
        'templateUrl': 'views/common/proxy_popup.html'
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
