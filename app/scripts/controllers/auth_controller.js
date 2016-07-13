/**
 * Authentication Controller
 */
window.safeLauncher.controller('authController', [ '$scope', '$state', '$rootScope', '$timeout',
  'authFactory', 'fieldValidator', 'CONSTANTS', 'MESSAGES',
  function($scope, $state, $rootScope, $timeout, auth, validator, CONSTANTS, MESSAGES) {
    var REQUEST_TIMEOUT = 90 * 1000;
    var FIELD_FOCUS_DELAY = 100;
    $scope.user = {};
    $scope.isLoading = false;

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
      $scope.isLoading = false;
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
        return msgEle.text(MESSAGES.PIN_MUST_BE_FOUR_CHAR_LONG_AND_NUM);
      }
      reset('keyword');
      if (value.length < CONSTANTS.KEYWORD_MIN_LEN) {
        inputParent.addClass('error').removeClass('warn');
        return msgEle.text(MESSAGES.KEYWORD_MUST_BE_SIX_CHAR_LONG);
      }
      reset('password');
      if (value.length < CONSTANTS.PASSWORD_MIN_LEN) {
        inputParent.addClass('error').removeClass('warn');
        return msgEle.text(MESSAGES.PASSWORD_MUST_BE_SIX_CHAR_LONG);
      }
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
      $scope.isLoading = true;
      request.execute(function(done) {
        auth.register(payload, done);
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
      if (!$scope.loginForm.$valid) {
          return validateAuthFields($scope.loginForm);
      }
      var request = new Request(onAuthResponse);
      $scope.cancelRequest = request.cancel;
      $scope.isLoading = true;
      request.execute(function(done) {
        auth.login($scope.user, done);
      });
    };
  }
]);
