// Storage and Data Constants
var CONFIG_URL = "config";
var PROFILE_URL = "2017/profiles";
var SUBMISSION_URL = "2017/submissions";

var app = angular
    .module("AnDevReviewerApp", ["firebase", "ngMaterial", "ngMessages"])
    .config(function($mdThemingProvider) {
      // Main content theme
      $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('red')
        .backgroundPalette('grey', {
          'default': '200'
        });
      // Card content theme
      $mdThemingProvider.theme('cardTheme')
        .primaryPalette('blue')
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
  $scope.twitterPattern = "@.*";
  $scope.config = Config();

  // login button function
  $scope.loginUser = function() {
    // create an instance of the authentication service
    var auth = $firebaseAuth();

    // login with Google
    auth.$signInWithPopup("google").then(function(firebaseUser) {
      $scope.firebaseUser = firebaseUser.user;
    }).catch(function(error) {
      $scope.error = error;
    });
  };

  // logout button function
  $scope.logoutUser = function() {
    // create an instance of the authentication service
    var auth = $firebaseAuth();

    auth.$signOut().then(function() {
      $scope.firebaseUser = null;
    });
  };
});

/* Controller ot manage review items */
app.controller("ReviewCtrl", function($scope, $firebaseAuth, $firebaseArray) {
  $scope.scores = [
    {id: 1, label: "1 - Inappropriate"},
    {id: 2, label: "2 - No Interest"},
    {id: 3, label: "3 - Would attend if nothing else"},
    {id: 4, label: "4 - Would make time to attend"},
    {id: 5, label: "5 - Would skip meeting to attend"}
  ];

  // create an instance of the authentication service
  var auth = $firebaseAuth();
  auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser == null) return;

    // set up data binding
    var ref = firebase.database().ref(SUBMISSION_URL);
    $scope.submissions = $firebaseArray(ref);
  });
});
