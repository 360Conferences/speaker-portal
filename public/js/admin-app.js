// Storage and Data Constants
var CONFIG_URL = "config";
var PROFILE_URL = "2017/profiles";
var SUBMISSION_URL = "2017/submissions";
var PLACEHOLDER_IMG = "/images/placeholder.png";

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

// Pass in a uid and get back their profile image
app.factory("Avatar", ["$firebaseStorage",
  function($firebaseStorage) {
    return function(uid) {
      var ref = firebase.storage().ref(PROFILE_URL);
      var avatarRef = ref.child(uid);

      // return it as a storage object
      return $firebaseStorage(avatarRef);
    }
  }
]);

/* Controller to manage user login */
app.controller("AuthCtrl", function($scope, $firebaseAuth, Config) {
  // add config parameters
  $scope.config = Config();
  $scope.validAdminUser = false;
  // Set the default selected tab
  $scope.tabs = {};
  $scope.tabs.selectedIndex = 0;

  // login button function
  $scope.loginUser = function() {
    // create an instance of the authentication service
    var auth = $firebaseAuth();

    // login with Google
    auth.$signInWithPopup("google").then(function(firebaseUser) {
      $scope.firebaseUser = firebaseUser.user;
      $scope.validAdminUser = $scope.firebaseUser.uid in $scope.config.admins;
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

/* Controller to list and manage speaker profiles */
app.controller("SpeakerCtrl", function($scope, $firebaseAuth, $firebaseArray) {
  // create an instance of the authentication service
  var auth = $firebaseAuth();
  auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser == null) return;

    var ref = firebase.database().ref(PROFILE_URL);
    var query = ref.orderByChild("name");

    $scope.profiles = $firebaseArray(query);
  });

  $scope.twitterUrl = function(twitterHandle) {
    return twitterHandle.replace('@', 'https://twitter.com/');
  };
});

app.controller("ProfileItemCtrl", function($scope, Avatar) {
  $scope.getAvatarUrl = function(item) {
    if ($scope.firebaseUser == null) return;

    Avatar(item.$id).$getDownloadURL().then(function(url) {
      $scope.avatarUrl = url;
    }).catch(function(error){
      // Load placeholder image
      $scope.avatarUrl = PLACEHOLDER_IMG;
    });
  };
});

/* Controller to list and manage session schedule */
app.controller("ScheduleCtrl", function($scope, $firebaseAuth, $firebaseObject, $firebaseArray, $mdDialog) {
  // create an instance of the authentication service
  var auth = $firebaseAuth();
  auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser == null) return;

    var profileRef = firebase.database().ref(PROFILE_URL);
    var submissionRef = firebase.database().ref(SUBMISSION_URL);
    var query = submissionRef.orderByChild("title");

    $scope.profiles = $firebaseObject(profileRef);
    $scope.submissions = $firebaseArray(query);
  });

  $scope.showSubmissionDetail = function(evt, submissionItem, profileItem) {
    ShowEntryDialog(evt, submissionItem, profileItem);
  }

  function ShowEntryDialog(evt, submissionItem, profileItem) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'submission.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true,
      locals: {
        entry: submissionItem,
        speaker: profileItem
      }
    })
    .then(function() {
      // Dialog cancelled
    });
  }

  // Handler for entry dialog events
  function DialogController($scope, $mdDialog, entry, speaker) {
    $scope.entry = entry;
    $scope.speaker = speaker;
    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.close = function() {
      $mdDialog.hide();
    };
  }
});

app.controller("SubmissionItemCtrl", function($scope) {
  // Only run on init/reload. Not currently data bound.
  $scope.computeReviewScore = function(item) {
    if ($scope.firebaseUser == null) return;

    //Set the default value
    $scope.avgScore = 0.0;
    if (item.scores) {
      var count = Object.keys(item.scores).length;
      if (count > 0) {
        var sum = 0.0;
        for (var key in item.scores) {
          sum += item.scores[key];
        }

        $scope.avgScore = sum / count;
      }
    }
  };
});
