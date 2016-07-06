/**
 * Authentication Controller
 */
window.safeLauncher.controller('authController', [ '$scope', '$state', '$rootScope', '$timeout',
  'authFactory', 'fieldValidator', 'CONSTANTS', 'MESSAGES',
  function($scope, $state, $rootScope, $timeout, auth, validator, CONSTANTS, MESSAGES) {
    var REQUEST_TIMEOUT = 90 * 1000;
    var FIELD_FOCUS_DELAY = 100;

    $scope.user = {};

    // handle authorisation before user logged-in
    auth.onAuthorisationReq(function(payload) {
      if (!$rootScope.isAuthenticated) {
        auth.confirmAuthorisation(payload, false);
      }
    });

    var Request = function(callback) {
      var self = this;
      var alive = true;
      var timer;

      var onResponse = function(err) {
        if (!alive) {
          return;
        }
        alive = false;
        $scope.authLoader.hide();
        callback(err);
        $timeout.cancel(timer);
      };

      self.cancel = function() {
        onResponse(new Error('Request cancelled'));
        alive = false;
      };

      self.execute = function(func) {
        $scope.authLoader.show();
        timer = $timeout(function() {
          onResponse(new Error('Operation timed out'));
          alive = false;
        }, REQUEST_TIMEOUT);
        func(onResponse);
      };
    };

    var onAuthResponse = function(err) {
      $scope.user = {};
      if (err) {
        $scope.authLoader.error = true;
        $scope.authLoader.show();
        return $scope.$applyAsync();
      }
      $rootScope.network.hide();
      $state.go('user');
    };

    var validateAuthFields = function(form) {
      var formEle = null;
      var inputEle = null;
      var inputParent = null;
      var msgEle = null;
      var value = null;
      var reset = function(target) {
        formEle = $('form[name=' + form.$name + ']');
        inputEle = formEle.find('input[name=' + form[target].$name + ']');
        inputParent = inputEle.parent();
        msgEle = inputEle.siblings('.msg').children('.txt');
        value = form[target].$viewValue;
        inputParent.removeClass('warn error');
      };
      reset('pin');
      if (isNaN(value) || value.length < CONSTANTS.PIN_MIN_LEN) {
        inputParent.addClass('error').removeClass('warn');
        msgEle.text(MESSAGES.PIN_MUST_BE_FOUR_CHAR_LONG_AND_NUM);
      }
      reset('keyword');
      if (value.length < CONSTANTS.KEYWORD_MIN_LEN) {
        inputParent.addClass('error').removeClass('warn');
        msgEle.text(MESSAGES.KEYWORD_MUST_BE_SIX_CHAR_LONG);
      }
      reset('password');
      if (value.length < CONSTANTS.PASSWORD_MIN_LEN) {
        inputParent.addClass('error').removeClass('warn');
        msgEle.text(MESSAGES.PASSWORD_MUST_BE_SIX_CHAR_LONG);
      }
    };

    // register user
    $scope.register = function() {
      if (!$scope.registerForm.$valid) {
          return validateAuthFields($scope.registerForm);
      }
      var payload = {
        pin: $scope.user.pin,
        keyword: $scope.user.keyword,
        password: $scope.user.password
      };
      var request = new Request(onAuthResponse);
      $scope.cancelRequest = request.cancel;
      request.execute(function(done) {
        auth.register(payload, done);
      });
      $scope.tabs.init();
    };

    // user login
    $scope.login = function() {
      if (!$scope.loginForm.$valid) {
          return validateAuthFields($scope.loginForm);
      }
      var request = new Request(onAuthResponse);
      $scope.cancelRequest = request.cancel;
      request.execute(function(done) {
        auth.login($scope.user, done);
      });
    };
  }
]);
