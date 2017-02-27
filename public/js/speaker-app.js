// Config Constants
var CONF_NAME = "360|AnDev";
var CONF_YEAR = "2017";
// Storage and Data Constants
var PROFILE_URL = "2017/profiles";
var SUBMISSION_URL = "2017/submissions";
var PLACEHOLDER_IMG = "/images/placeholder.png";

var app = angular
    .module("AnDevSpeakerApp", ["firebase", "ngMaterial", "ngMessages", "ngFileUpload", "ngImgCrop"])
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

// Pass in a uid and get back their synchronized data
app.factory("Profile", ["$firebaseObject",
  function($firebaseObject) {
    return function(uid) {
      var ref = firebase.database().ref(PROFILE_URL);
      var profileRef = ref.child(uid);

      // return it as a synchronized object
      return $firebaseObject(profileRef);
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

// Pass in an id and get back an entry ref
app.factory("Submission", ["$firebaseObject",
  function($firebaseObject) {
    return function(id) {
      var ref = firebase.database().ref(SUBMISSION_URL);
      var entryRef = ref.child(id);

      // return is as a synchronized object
      return $firebaseObject(entryRef);
    }
  }
]);

/* Controller to manage user login */
app.controller("AuthCtrl", function($scope, $firebaseAuth) {
  // add config parameters
  $scope.eventName = CONF_NAME;
  $scope.eventYear = CONF_YEAR;
  $scope.twitterPattern = "@.*";

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

/* Controller to manage speaker profile data */
app.controller("SpeakerCtrl", function($scope, $firebaseAuth, $mdDialog, $mdToast, Profile, Avatar) {
  // create an instance of the authentication service
  var auth = $firebaseAuth();
  auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser == null) return;

    // set up data binding
    $scope.speaker = Profile(firebaseUser.uid);
    Avatar(firebaseUser.uid).$getDownloadURL().then(function(url) {
      $scope.avatarUrl = url;
    }).catch(function(error){
      // Load placeholder image
      $scope.avatarUrl = PLACEHOLDER_IMG;
    });
  });

  // Save the speaker info
  $scope.saveProfile = function() {
    if ($scope.speakerForm.$valid) {
      // Save new data to Firebase
      $scope.speaker.$save().then(function() {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Profile Saved')
            .hideDelay(3000)
        );
      }).catch(function(error) {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Error saving profile. Please try again later.')
            .hideDelay(3000)
        );
      });
    } else {
      // Remind them to fix their errors
      $mdToast.show(
        $mdToast.simple()
          .textContent('Please correct errors in the form and re-submit.')
          .hideDelay(3000)
      );
    }
  }

  // Show dialog to upload new image
  $scope.cropImage = function(evt) {
    ShowCropDialog(evt);
  };

  function ShowCropDialog(evt) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'crop.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true
    })
    .then(function(croppedImage) {
      // Save the new image
      ImageUploadController(croppedImage);
    }, function() {
      // Dialog cancelled
    });
  }

  // Handler for entry dialog events
  function DialogController($scope, $mdDialog) {
    $scope.imageLoaded = false;

    $scope.onLoadDone = function() {
      $scope.imageLoaded = true;
    };

    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.save = function(croppedImage) {
      //Verify an image was uploaded first
      if ($scope.imageLoaded) {
        $mdDialog.hide(croppedImage);
      }
    };
  }

  // Post the cropped image to Firebase storage
  function ImageUploadController(croppedImage) {
    var firebaseUser = $scope.firebaseUser;
    var storage = Avatar(firebaseUser.uid);

    var uploadTask = storage.$putString(croppedImage, "data_url", { contentType: "image/png" });
    uploadTask.$progress(function(snapshot) {
      $scope.showUploadProgress = true;
    });
    uploadTask.$error(function(error) {
      // Upload failed
      $scope.showUploadProgress = false;
    });
    uploadTask.$complete(function(snapshot) {
      // Upload completed successfully
      storage.$getDownloadURL().then(function(url) {
          $scope.showUploadProgress = false;
          $scope.avatarUrl = url;
      });
    });
  }
});

/* Controller to manage talk submissions */
app.controller("SubmissionCtrl", function($scope, $firebaseAuth, $firebaseArray, $mdDialog, Submission) {
  // create an instance of the authentication service
  var auth = $firebaseAuth();
  auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser == null) return;

    var ref = firebase.database().ref(SUBMISSION_URL);
    var query = ref.orderByChild("speaker_id").equalTo(firebaseUser.uid);

    $scope.submissions = $firebaseArray(query);
  });

  // Add a new submission to the list
  $scope.addSubmission = function(evt) {
    var entry = {};
    ShowEntryDialog(evt, entry);
  };

  // Edit the selected item
  $scope.editSubmission = function(evt, item) {
    var entry = {
      id: item.$id,
      title: item.title,
      abstract: item.abstract
    };
    ShowEntryDialog(evt, entry);
  }

  // Remote the selected item from the list
  $scope.deleteSubmission = function(evt, item) {
    ShowConfirmDialog(evt, item);
  };

  function ShowConfirmDialog(evt, entry) {
    var confirm = $mdDialog.confirm()
          .title('Are You Sure?')
          .textContent('Are you sure you want to remove "' + entry.title + '"?')
          .ariaLabel('Delete Submission')
          .targetEvent(evt)
          .ok('Yes, Delete')
          .cancel('No, Just Kidding');

    $mdDialog.show(confirm).then(function() {
      $scope.submissions.$remove(entry);
    }, function() {
      // Dialog cancelled
    });
  };

  function ShowEntryDialog(evt, submissionItem) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'entry.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true,
      locals: {
        entry: submissionItem
      }
    })
    .then(function(entry) {
      SubmissionEntryController(entry);
    }, function() {
      // Dialog cancelled
    });
  }

  // Handler for entry dialog events
  function DialogController($scope, $mdDialog, entry) {
    $scope.entry = entry;
    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.save = function(entry) {
      if ($scope.entryForm.$valid) {
        $mdDialog.hide(entry);
      }
    };
  }

  // Handler for entry dialog save
  function SubmissionEntryController(entry) {
    if (entry.id != null) {
      // Edit the existing object
      var entryObject = Submission(entry.id);
      entryObject.$loaded(
        function(data) {
          entryObject.title = entry.title;
          entryObject.abstract = entry.abstract;
          entryObject.$save();
        },
        function(error) {
          console.error("Error:", error);
        }
      );
    } else {
      // Add a new object for this speaker
      entry.speaker_id = $scope.firebaseUser.uid;
      $scope.submissions.$add(entry);
    }
  }
});
