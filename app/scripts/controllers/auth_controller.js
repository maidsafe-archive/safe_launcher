/**
 * Authentication Controller
 */
window.safeLauncher.controller('authController', [ '$scope', '$state', '$rootScope', '$timeout',
  'authFactory', 'CONSTANTS', 'MESSAGES',
  function($scope, $state, $rootScope, $timeout, auth, CONSTANTS, MESSAGES) {
    var REQUEST_TIMEOUT = 90 * 1000;
    var FIELD_FOCUS_DELAY = 100;

    var showErrorField = function(targetId, msg) {
      var errorTarget = $('#' + targetId);
      errorTarget.addClass('error');
      errorTarget.children('.msg').text(msg);
      errorTarget.children('input').focus();
    };

    // user create account
    var createAccount = function() {
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
    $scope.secretValid = false;
    $scope.passwordValid = false;
    $scope.createAccFlow = {
      states: [
        'WELCOME',
        'ACC_INFO',
        'ACC_SECRET_FORM',
        'ACC_PASS',
        'ACC_PASS_FORM'
      ],
      totalCount: function() {
        return this.states.length;
      },
      currentPos: 0,
      getPos: function(state) {
        return this.states.indexOf(state);
      },
      setPos: function(state) {
        if (this.states.indexOf(state) > this.states.indexOf('ACC_SECRET_FORM')) {
          if (!$scope.secretValid) {
            return showErrorField('AccountSecret', MESSAGES.ACC_SECRET_MUST_STRONGER);
          }
          if ($scope.user.accountSecret !== $scope.user.confirmAccountSecret) {
            return showErrorField('AccountSecretConfirm', MESSAGES.ENTRIES_DONT_MATCH);
          }
        }
        $state.go('app.account', {currentPage: $state.params.currentPage, currentState: state}, {notify: false});
        this.currentPos = state ? this.states.indexOf(state) : 0;
      },
      continue: function() {
        if (this.currentPos < (this.totalCount() - 1)) {
          return this.setPos(this.states[this.currentPos + 1]);
        }
        if (this.currentPos === this.states.indexOf('ACC_PASS_FORM')) {
          if (!$scope.passwordValid) {
            return showErrorField('AccountPass', MESSAGES.ACC_PASS_MUST_STRONGER);
          }
          if ($scope.user.accountPassword !== $scope.user.confirmAccountPassword) {
            return showErrorField('AccountPassConfirm', MESSAGES.ENTRIES_DONT_MATCH);
          }
        }
        createAccount();
      },
      back: function() {
        if (this.currentPos > 0) {
          this.currentPos--;
        }
        $state.go('app.account', {currentPage: $state.params.currentPage, currentState: this.states[this.currentPos]}, {notify: false});
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
        if ($state.params.currentPage === 'register') {
          $state.go('app.account', {currentPage: 'register', currentState: $scope.createAccFlow.states[2]}, {reload: true});
          $rootScope.user= {};
          return $rootScope.$toaster.show({
            msg: 'Failed to create account',
            isError: true
          }, function() {});
        }
        var errorTarget = $('#errorTarget');
        errorTarget.addClass('error');
        errorTarget.children('.msg').text('Invalid entries, account does not exist.');
        errorTarget.children('input').focus();
        errorTarget.children('input').bind('keyup', function(e) {
          errorTarget.children('.msg').text('');
          errorTarget.removeClass('error');
        });
        return $rootScope.$toaster.show({
          msg: 'Authentication failed, invalid entries',
          isError: true
        }, function() {});
      }
      $rootScope.isAuthenticated = true;
      $rootScope.$applyAsync();
      console.log('Authorised successfully!');
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

    $scope.createAccNavigation = function(e, state) {
      if (e.target.className.split(',').indexOf('disabled') !== -1) {
        return;
      }
      $scope.createAccCurrentState = state;
    };
  }
]);
