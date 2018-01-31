/*
 * Speaker app module
 */
var app = angular
    .module("SpeakerApp", ["conference.model", "firebase", "ngMaterial", "ngMessages", "ngFileUpload", "ngImgCrop"])
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
      $scope.avatarUrl = "/images/placeholder.png";
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

    var uploadTask = storage.$putString(croppedImage, "data_url", { contentType: "image/jpeg" });
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
app.controller("SubmissionCtrl", function($scope, $firebaseAuth, $mdDialog, $mdToast, Submission, UserSubmissions, Feedback) {
  // create an instance of the authentication service
  var auth = $firebaseAuth();
  auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser == null) return;

    $scope.submissions = UserSubmissions(firebaseUser.uid);
    $scope.feedback = Feedback();
  });

  // Add a new submission to the list
  $scope.addSubmission = function(evt) {
    if($scope.speakerForm.$valid && $scope.speaker.agree_terms) {
      // Simple check that the form was filled out
      // Note: Doesn't actually check if profile saved.
      var entry = {};
      ShowEntryDialog(evt, entry);
    } else {
      // Show error toast
      $mdToast.show(
        $mdToast.simple()
          .textContent('Please save your speaker profile first.')
          .hideDelay(3000)
      );
    }
  };

  // Edit Rule: Not editable during the review period
  $scope.shouldEditItem = function(item) {
    if ($scope.config.review_open) { // Nothing is editable during review
      return false;
    } else { // Otherwise, edit during CFP or if accepted
      return $scope.config.cfp_open || item.accepted;
    }
  }

  // Delete Rule: Not removable during review or once accepted
  $scope.shouldDeleteItem = function(item) {
    if ($scope.config.review_open) { // Nothing is removable during review
      return false;
    } else {
      return !item.accepted;
    }
  }

  // Edit the selected item
  $scope.editSubmission = function(evt, item) {
    var entry = {
      id: item.$id,
      title: item.title,
      duration: item.duration,
      abstract: item.abstract,
      notes: item.notes
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
        entry: submissionItem,
        config: $scope.config
      }
    })
    .then(function(entry) {
      SubmissionEntryController(entry);
    }, function() {
      // Dialog cancelled
    });
  }

  // Handler for entry dialog events
  function DialogController($scope, $mdDialog, entry, config) {
    $scope.entry = entry;
    $scope.config = config;
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
          entryObject.duration = entry.duration;
          entryObject.abstract = entry.abstract;
          entryObject.notes = entry.notes;
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

  $scope.shouldShowFeedback = function(item) {
    if ($scope.feedback.scores && $scope.feedback.scores[item.$id]) {
      return $scope.config.show_feedback;
    } else {
      return false;
    }
  }

  $scope.showFeedback = function(evt, item) {
    var scores = $scope.feedback.scores[item.$id];
    ShowFeedbackDialog(evt, item, scores);
  }

  function ShowFeedbackDialog(evt, submission, feedback) {
    $mdDialog.show({
      controller: FeedbackDialogController,
      templateUrl: 'feedback.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true,
      locals: {
        item: submission,
        scores: feedback
      }
    })
    .then(function() {
      // Dialog hidden
    }, function() {
      // Dialog cancelled
    });
  }

  // Handler for feedback dialog events
  function FeedbackDialogController($scope, $mdDialog, item, scores) {
    $scope.submission = item;
    $scope.feedback = scores;

    $scope.getOverallAvg = function(scores) {
      return getAverageScore("overall", scores);
    }

    $scope.getTechnicalAvg = function(scores) {
      return getAverageScore("technical", scores);
    }

    $scope.getSpeakerAvg = function(scores) {
      return getAverageScore("speaker", scores);
    }

    function getAverageScore(score_type, scores) {
      var sum = 0.0;
      var count = 0;

      for (var key in scores) {
        if (scores.hasOwnProperty(key)) {
          sum += scores[key][score_type];
          count++;
        }
      }

      return sum / count;
    }

    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.close = function() {
      $mdDialog.hide();
    };
  }
});
