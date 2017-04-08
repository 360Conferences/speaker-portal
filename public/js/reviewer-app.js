// Storage and Data Constants
var CONFIG_URL = "config";
var PROFILE_URL = "2017/profiles";
var SUBMISSION_URL = "2017/submissions";

var app = angular
    .module("AnDevReviewerApp", ["firebase", "ngMaterial", "ngMessages"])
    .config(function($mdThemingProvider) {
      // Main content theme
      $mdThemingProvider.theme('default')
        .primaryPalette('teal')
        .accentPalette('red')
        .backgroundPalette('grey', {
          'default': '200'
        });
      // Card content theme
      $mdThemingProvider.theme('cardTheme')
        .primaryPalette('teal')
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
    {id: 2, label: "2 - I'd rather be in the hallway"},
    {id: 3, label: "3 - I would attend if nothing else were going on"},
    {id: 4, label: "4 - I would like to attend this talk"},
    {id: 5, label: "5 - OMG, I will make time to attend this talk"}
  ];

  // create an instance of the authentication service
  var auth = $firebaseAuth();
  auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser == null) return;

    // set up data binding
    var ref = firebase.database().ref(SUBMISSION_URL);
    var query = ref.orderByChild("title");
    $scope.submissions = $firebaseArray(query);
  });

  // Logic to hide talks from reviewers
  $scope.shouldShowItem = function(item) {
    if ($scope.firebaseUser == null) return false;
    
    // Speakers can't vote on their own talks
    if (item.speaker_id === $scope.firebaseUser.uid) {
      return false;
    }

    // Accepted talks should not be shown
    if (item.accepted) {
      return false;
    }

    return true;
  };
});
