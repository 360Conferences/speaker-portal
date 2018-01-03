/*
 * Reviewer app module
 */
var app = angular
    .module("ReviewerApp", ["conference.model", "firebase", "ngMaterial", "ngMessages"])
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
app.controller("ReviewCtrl", function($scope, $firebaseAuth, SubmissionList) {
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
    $scope.submissions = SubmissionList();
  });

  // Logic to hide talks from reviewers
  $scope.shouldShowItem = function(item) {

    // Review is closed or not logged in
    if ($scope.firebaseUser == null) return false;
    if (!$scope.config.review_open) return false;

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
