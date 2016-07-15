/**
 * Authentication Controller
 */
window.safeLauncher.controller('authController', [ '$scope', '$state', '$rootScope', '$timeout',
  'authFactory', 'fieldValidator', 'CONSTANTS', 'MESSAGES',
  function($scope, $state, $rootScope, $timeout, auth, validator, CONSTANTS, MESSAGES) {
    var REQUEST_TIMEOUT = 90 * 1000;
    var FIELD_FOCUS_DELAY = 100;
    $scope.user = {};
    // $scope.registerTab = {
    //   tabs: {
    //     PIN: 'pin',
    //     KEYWORD: 'keyword',
    //     PASSWORD: 'password'
    //   },
    //   current: null,
    //   setCurrent: function(pos) {
    //     this.current = pos;
    //   },
    //   init: function() {
    //     this.current = this.tabs.PIN;
    //     $scope.$applyAsync();
    //   }
    // };

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

    var focusField = function(form, field) {
      $('form[name=' + form + ']').find('input[name=""]')
      return true;
    };

    var validateAuthFields = function(form, fields) {
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

      var check = function(field) {
        switch (field) {
          case 'pin':
            if (isNaN(value) || value.length < CONSTANTS.PIN_MIN_LEN) {
              inputParent.addClass('error').removeClass('warn');
              msgEle.text(MESSAGES.PIN_MUST_BE_FOUR_CHAR_LONG_AND_NUM);
              return;
            }
            break;
          case 'keyword':
            if (value.length < CONSTANTS.KEYWORD_MIN_LEN) {
              inputParent.addClass('error').removeClass('warn');
              msgEle.text(MESSAGES.KEYWORD_MUST_BE_SIX_CHAR_LONG);
              return;
            }
            break;
          case 'password':
            if (value.length < CONSTANTS.PASSWORD_MIN_LEN) {
              inputParent.addClass('error').removeClass('warn');
              msgEle.text(MESSAGES.PASSWORD_MUST_BE_SIX_CHAR_LONG);
              return;
            }
            break;
          case 'cpin':
            if (value !== $scope.user.pin) {
              inputParent.addClass('error').removeClass('warn');
              return msgEle.text(MESSAGES.ENTRIES_DONT_MATCH);
            }
            break;
          case 'ckeyword':
            if (value !== $scope.user.keyword) {
              inputParent.addClass('error').removeClass('warn');
              return msgEle.text(MESSAGES.ENTRIES_DONT_MATCH);
            }
            break;
          case 'cpassword':
            if (value !== $scope.user.password) {
              inputParent.addClass('error').removeClass('warn');
              return msgEle.text(MESSAGES.ENTRIES_DONT_MATCH);
            }
            break;
          default:
            return true;
        }
        return true;
      };

      for(var i in fields) {
        field = fields[i];
        reset(field);
        if (!check(field)) {
          break;
        }
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
          return validateAuthFields($scope.registerForm, [ 'pin', 'keyword', 'password' ]);
      }
      var payload = {
        pin: $scope.user.pin,
        keyword: $scope.user.keyword,
        password: $scope.user.password
      };
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
