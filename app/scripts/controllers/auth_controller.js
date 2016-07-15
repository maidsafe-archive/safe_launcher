/**
 * Authentication Controller
 */
window.safeLauncher.controller('authController', [ '$scope', '$state', '$rootScope', '$timeout',
  'authFactory', 'fieldValidator', 'CONSTANTS', 'MESSAGES',
  function($scope, $state, $rootScope, $timeout, auth, validator, CONSTANTS, MESSAGES) {
    var REQUEST_TIMEOUT = 90 * 1000;
    var FIELD_FOCUS_DELAY = 100;
    $scope.user = {};
    var Request = function(callback) {
      var self = this;
      var alive = true;
      var timer;

      var onResponse = function(err) {
        if (!alive) {
          return;
        }
        alive = false;
        callback(err);
        $timeout.cancel(timer);
      };

      self.cancel = function() {
        onResponse(new Error('Request cancelled'));
        alive = false;
      };

      self.execute = function(func) {
        timer = $timeout(function() {
          onResponse(new Error('Operation timed out'));
          alive = false;
        }, REQUEST_TIMEOUT);
        func(onResponse);
      };
    };

    var onAuthResponse = function(err) {
      $rootScope.isAuthLoading = false;
      $scope.$applyAsync();
      $rootScope.userInfo = $scope.user;
      $scope.user = {};
      if (err) {
        return $rootScope.$toaster.show({
          msg: 'Invalid PIN, Keyword or Password.',
          isError: true
        }, function() {});
      }
      $rootScope.isAuthenticated = true;
      $rootScope.$applyAsync();
      console.log('Authorised successfully!');
    };

    // user register
    $scope.register = function() {
      if ($rootScope.$networkStatus.status !== window.NETWORK_STATE.CONNECTED) {
        return $rootScope.$toaster.show({
          msg: 'Network not yet conneted',
          hasOption: false,
          isError: true
        }, function() {});
      }
      var payload = $scope.user.password;
      var request = new Request(onAuthResponse);
      $scope.cancelRequest = request.cancel;
      $rootScope.isAuthLoading = true;
      request.execute(function(done) {
        auth.register(payload, done);
      });
    };

    // $scope.checkPin = function() {
    //   if (!$scope.pinForm.$valid) {
    //       return validateAuthFields($scope.pinForm, [ 'pin', 'cpin' ]);
    //   }
    //   $scope.registerTab.current = $scope.registerTab.tabs.KEYWORD;
    //   $scope.$applyAsync();
    // };
    //
    // $scope.checkKeyword = function() {
    //   if (!$scope.keywordForm.$valid) {
    //       return validateAuthFields($scope.keywordForm, [ 'keyword', 'ckeyword' ]);
    //   }
    //   $scope.registerTab.current = $scope.registerTab.tabs.PASSWORD;
    //   $scope.$applyAsync();
    // };
    //
    // $scope.checkPassword = function() {
    //   if (!$scope.passwordForm.$valid) {
    //       return validateAuthFields($scope.passwordForm, [ 'password', 'cpassword' ]);
    //   }
    //   register();
    // };

    // user login
    $scope.login = function() {
      if ($rootScope.$networkStatus.status !== window.NETWORK_STATE.CONNECTED) {
        return $rootScope.$toaster.show({
          msg: 'Network not yet conneted',
          hasOption: false,
          isError: true
        }, function() {});
      }
      if (!$scope.loginForm.$valid) {
          return validateAuthFields($scope.loginForm, [ 'pin', 'keyword', 'password' ]);
      }
      var request = new Request(onAuthResponse);
      $scope.cancelRequest = request.cancel;
      $rootScope.isAuthLoading = true;
      request.execute(function(done) {
        auth.login($scope.user, done);
      });
    };

    // $scope.registerTab.init();
  }
]);
