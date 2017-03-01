// Storage and Data Constants
var CONFIG_URL = "config";
var PROFILE_URL = "2017/profiles";
var SUBMISSION_URL = "2017/submissions";

var app = angular
    .module("AnDevAdminApp", ["firebase", "ngMaterial", "ngMessages"])
    .config(function($mdThemingProvider) {
      // Main content theme
      $mdThemingProvider.theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('red')
        .backgroundPalette('grey', {
          'default': '200'
        });
      // Card content theme
      $mdThemingProvider.theme('cardTheme')
        .primaryPalette('blue-grey')
        .accentPalette('red')
        .backgroundPalette('grey', {
          'default': '50'
        });
    });

// Retrieve the app config object
app.factory("Config", ["$firebaseObject",
  function($firebaseObject) {
    return function() {
      var ref = firebase.database().ref(CONFIG_URL);

      // return it as a synchronized object
      return $firebaseObject(ref);
    }
  }
]);

/* Controller to manage user login */
app.controller("AuthCtrl", function($scope, $firebaseAuth, Config) {
  // add config parameters
  $scope.config = Config();
  $scope.validAdminUser = false;

  // login button function
  $scope.loginUser = function() {
    // create an instance of the authentication service
    var auth = $firebaseAuth();

    // login with Google
    auth.$signInWithPopup("google").then(function(firebaseUser) {
      $scope.firebaseUser = firebaseUser.user;
      $scope.validAdminUser = $scope.config.admins.indexOf($scope.firebaseUser.uid) !== -1;
    }).catch(function(error) {
      $scope.error = error;
      $scope.validAdminUser = false;
    });
  };

  // logout button function
  $scope.logoutUser = function() {
    // create an instance of the authentication service
    var auth = $firebaseAuth();

    auth.$signOut().then(function() {
      $scope.firebaseUser = null;
      $scope.validAdminUser = false;
    });
  };
});

/* TODO */
app.controller("AdminCtrl", function($scope, $firebaseAuth, $firebaseArray) {
  $scope.tabs = {};
  $scope.tabs.selectedIndex = 0;
});
