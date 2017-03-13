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
app.controller("AuthCtrl", function($scope, $firebaseAuth, $firebaseObject, $firebaseArray, Config) {
  // add config parameters
  $scope.config = Config();
  $scope.validAdminUser = false;
  // Set the default selected tab
  $scope.tabs = {};
  $scope.tabs.selectedIndex = 0;

  // create an instance of the authentication service
  var auth = $firebaseAuth();
  auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser == null) return;

    var profileRef = firebase.database().ref(PROFILE_URL);
    var profileQuery = profileRef.orderByChild("name");
    var submissionRef = firebase.database().ref(SUBMISSION_URL);
    var submissionQuery = submissionRef.orderByChild("title");

    // Fetch firebase data
    $scope.profiles = $firebaseObject(profileRef);
    $scope.profilesList = $firebaseArray(profileQuery)
    $scope.submissions = $firebaseArray(submissionQuery);
    // Compute reviewer data
    $scope.scores = {};
    $scope.submissions.$loaded().then(function() {
      angular.forEach($scope.submissions, function(submission) {
        ComputeReviewScore(submission, $scope.scores);
      })
    });
  });

  function ComputeReviewScore(item, scores) {
    //Set the default value
    scores[item.$id] = 0.0;
    if (item.scores) {
      var count = Object.keys(item.scores).length;
      if (count > 0) {
        var sum = 0.0;
        for (var key in item.scores) {
          sum += item.scores[key];
        }

        scores[item.$id] = sum / count;
      }
    }
  }

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
app.controller("ProfileCtrl", function($scope, $firebaseArray, $mdDialog) {

  $scope.showProfileDetail = function(evt, profileItem, avatarUrl) {
    ShowProfileDialog(evt, profileItem, avatarUrl);
  }

  function ShowProfileDialog(evt, profileItem, avatarUrl) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'profile.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true,
      locals: {
        speaker: profileItem,
        imageUrl: avatarUrl
      }
    })
    .then(function() {
      // Dialog cancelled
    });
  }

  // Handler for entry dialog events
  function DialogController($scope, $mdDialog, speaker, imageUrl) {
    $scope.speaker = speaker;
    $scope.imageUrl = imageUrl;
    $scope.twitterUrl = function(twitterHandle) {
      return twitterHandle.replace('@', 'https://twitter.com/');
    };

    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.close = function() {
      $mdDialog.hide();
    };
  }
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

/* Controller to list and manage submission items */
app.controller("SubmissionCtrl", function($scope, $firebaseObject, $firebaseArray, $mdDialog) {
  $scope.sortOptions = [
    {value: 'title', label: "Session Title"},
    {value: 'name', label: "Speaker Name"},
    {value: 'score', label: "Reviewer Score"}
  ];
  $scope.sortProperty = 'title';
  $scope.reverseSort = false;
  $scope.getSortParam = function(item) {
    switch ($scope.sortProperty) {
      case 'name':
        $scope.reverseSort = false;
        return $scope.profiles[item.speaker_id] ?
                $scope.profiles[item.speaker_id].name : "";
      case 'score':
        $scope.reverseSort = true;
        return $scope.scores[item.$id];
      case 'title':
      default:
        $scope.reverseSort = false;
        return item.title;
    }
  }

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