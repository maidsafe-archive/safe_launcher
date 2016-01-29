/*global safeLauncher:false, $:false; console:false */

safeLauncher.controller('AuthController', [ '$scope', 'AuthFactory',
  function($scope, Auth) {
    /**
     * Reset registration form
     */
    var resetRegistration = function() {
      $scope.safeNewUser = {};
      $scope.registerTab.currentPos = 1;
    };

    /**
     * user registration
     */
    var register = function(payload) {
      Auth.register(payload, function(err, data) {
        if (err) {
          alert(err);
          return;
        }
        alert(data);
        resetRegistration();
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
            if (!(new RegExp(/^[a-z0-9]+$/i)).test($scope.safeNewUser[key].value)) {
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
  }
]);
