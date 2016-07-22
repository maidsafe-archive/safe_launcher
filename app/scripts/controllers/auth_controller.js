/**
 * Authentication Controller
 */
window.safeLauncher.controller('authController', [ '$scope', '$state', '$rootScope', '$timeout',
  'authFactory', 'CONSTANTS', 'MESSAGES',
  function($scope, $state, $rootScope, $timeout, auth, CONSTANTS, MESSAGES) {
    var REQUEST_TIMEOUT = 90 * 1000;
    var FIELD_FOCUS_DELAY = 100;
    $scope.user = {};
    $scope.secretValid = false;
    $scope.secretValid = false;
    $scope.passwordValid = false;
    $scope.createAccState = 0;
    $scope.authIntro = {
      totalCount: 3,
      currentPos: 1,
      continue: function() {
        if (this.currentPos < this.totalCount) {
          this.currentPos++;
        } else if (this.currentPos === this.totalCount) {
          $state.go('app.account', {currentPage: 'register'});
        }
      },
      back: function() {
        if (this.currentPos > 1) {
          this.currentPos--;
        }
      }
    };
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
      $rootScope.userInfo = $scope.user.password;
      $scope.user = {};
      if (err) {
        // TODO set register/login based error messages
        var errorTarget = $('#errorTarget');
        errorTarget.addClass('error');
        errorTarget.children('.msg').text('Invalid entries, account does not exist.');
        return $rootScope.$toaster.show({
          msg: 'Authentication failed, invalid entries',
          isError: true
        }, function() {});
      }
      $rootScope.isAuthenticated = true;
      $rootScope.setLastLogin();
      $rootScope.$applyAsync();
      console.log('Authorised successfully!');
    };

    // user create account
    $scope.createAccount = function() {
      if ($rootScope.$networkStatus.status !== window.NETWORK_STATE.CONNECTED) {
        return $rootScope.$toaster.show({
          msg: 'Network not yet conneted',
          hasOption: false,
          isError: true
        }, function() {});
      }
      var request = new Request(onAuthResponse);
      $scope.cancelRequest = request.cancel;
      $rootScope.isAuthLoading = true;
      request.execute(function(done) {
        auth.register($scope.user.accountSecret, $scope.user.accountPassword, done);
      });
    };

    // user login
    $scope.login = function() {
      if ($rootScope.$networkStatus.status !== window.NETWORK_STATE.CONNECTED) {
        return $rootScope.$toaster.show({
          msg: 'Network not yet conneted',
          hasOption: false,
          isError: true
        }, function() {});
      }
      var request = new Request(onAuthResponse);
      $scope.cancelRequest = request.cancel;
      $rootScope.isAuthLoading = true;
      request.execute(function(done) {
        auth.login($scope.user.accountSecret, $scope.user.accountPassword, done);
      });
    };

    $scope.checkPasswordValid = function(result) {
      $scope.passwordValid = result;
      $scope.$applyAsync();
    };

    $scope.checkSecretValid = function(result) {
      $scope.secretValid = result;
      $scope.$applyAsync();
    };

    $scope.setAccountSecret = function() {
      $scope.createAccState = 1;
    };
  }
]);
