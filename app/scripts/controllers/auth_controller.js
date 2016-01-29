/*global safeLauncher:false, $:false; alert:false */

safeLauncher.controller('AuthController', [ '$scope', '$state', 'AuthFactory',
  function($scope, $state, Auth) {
    // Reset registration form
    var resetRegistration = function() {
      $scope.safeNewUser = {};
      $scope.registerTab.currentPos = 1;
    };

    // Reset login form
    var resetLogin = function() {
      $scope.safeUser = {};
    };

    // check value is alpha numeric
    var isAlphaNumeric = function(val) {
      return (new RegExp(/^[a-z0-9]+$/i)).test(val);
    };

    /**
     * user registration
     */
    var register = function(payload) {
      Auth.register(payload, function(err, data) {
        resetRegistration();
        if (err) {
          alert(err);
          return;
        }
        alert(data);
      });
    };

    /**
     * user login
     */
    var login = function() {
      if (!$scope.safeUser.hasOwnProperty('pin') || !$scope.safeUser.hasOwnProperty('keyword') ||
        !$scope.safeUser.hasOwnProperty('password')) {
        alert('All fields are required');
        return;
      }
      if (isNaN($scope.safeUser.pin) || $scope.safeUser.pin.length < 4) {
        alert('Invalid PIN');
        return;
      }
      if (!isAlphaNumeric($scope.safeUser.keyword) || !isAlphaNumeric($scope.safeUser.password) ||
        $scope.safeUser.keyword.length < 6 || $scope.safeUser.password.length < 6) {
        alert('Invalid Keyword or Password');
        return;
      }
      Auth.login($scope.safeUser, function(err, data) {
        resetLogin();
        if (err) {
          alert(err);
          return;
        }
        alert(data);
        $state.go('user');
      });
    };

    // registation tabbing
    $scope.registerTab = {
      currentPos: 1,
      count: 3,
      changePosition: function(pos) {
        var self = this;

        // validate
        var validate = function(key) {
          var check = false;
          if (!$scope.safeNewUser.hasOwnProperty(key) || !$scope.safeNewUser[key].hasOwnProperty('value') ||
          !$scope.safeNewUser[key].hasOwnProperty('confirm')) {
            alert('All field required');
            return check;
          }

          if (!$scope.safeNewUser[key].value || !$scope.safeNewUser[key].confirm) {
            alert('Field should not be left empty');
            return check;
          }

          if (key === 'pin') {
            if (isNaN($scope.safeNewUser[key].value)) {
              alert('PIN must contain only numeric');
              return check;
            }

            if ($scope.safeNewUser[key].value.length < 4) {
              alert('PIN should contain atleast 4 characters');
              return check;
            }
          }

          if (key === 'keyword' || key === 'password') {
            if (!isAlphaNumeric($scope.safeNewUser[key].value)) {
              alert('Keyword/Password must not contain special characters');
              return check;
            }

            if ($scope.safeNewUser[key].value.length < 6) {
              alert('Keyword/Password should contain atleast 6 characters');
              return check;
            }
          }

          if ($scope.safeNewUser[key].value !== $scope.safeNewUser[key].confirm) {
            alert('Values must be same');
            return check;
          }
          return !check;
        };

        switch (pos) {
          case 1:
            self.currentPos = pos;
            break;
          case 2:
            if (!validate('pin')) {
              return;
            }
            self.currentPos = pos;
            break;
          case 3:
            if (!validate('pin') || !validate('keyword')) {
              return;
            }
            self.currentPos = pos;
            break;
          case self.count + 1:
            if (!validate('password')) {
              self.currentPos = 3;
              return;
            }
            register($scope.safeNewUser);
            break;
        }
      }
    };

    $scope.safeNewUser = {};
    $scope.safeUser = {};
    $scope.login = login;
  }
]);
