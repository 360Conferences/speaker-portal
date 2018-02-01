/*
 * Admin app module
 */
var app = angular
    .module("AdminApp", ["conference.model", "firebase", "ngMaterial", "ngMessages", "ngSanitize", "ngCsv"])
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

/* Controller to manage user login */
app.controller("AuthCtrl", function($scope, $firebaseAuth, $mdDialog, $mdSidenav, $mdToast, $mdConstant, Config, Venue, Avatar, Feedback, Profile, ProfileList, Submission, SubmissionList, AcceptedSubmissions, Session, SessionList) {
  // add config parameters
  $scope.config = Config();
  $scope.venue = Venue();
  $scope.validAdminUser = false;

  // init geocoder
  $scope.geocoder = new google.maps.Geocoder();

  // Set the navigation selections
  $scope.toggleSidenav = function() {
    $mdSidenav('left').toggle();
  }
  $scope.closeSidenav = function () {
      $mdSidenav('left').close();
  }
  $scope.showView = function(item) {
    $scope.selectedPanel = item;
    $mdSidenav('left').close();
  }
  $scope.selectedPanel = 'speakers';

  $scope.showEventConfig = function(evt) {
    ShowConfigDialog(evt, $scope.config, $scope.venue);
    $mdSidenav('left').close();
  }

  function ShowConfigDialog(evt, config, venue) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'config.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true,
      locals: {
        localConfig: config,
        localVenue: venue
      }
    })
    .then(function(venue) {
      // Geocode the address, then save
      $scope.geocoder.geocode( { 'address': venue.address}, function(results, status) {
          if (status == 'OK') {
            venue.latitude = results[0].geometry.location.lat();
            venue.longitude = results[0].geometry.location.lng();
            venue.$save().then(function() {
              $mdToast.show(
                $mdToast.simple()
                  .textContent('Venue updated')
                  .hideDelay(3000)
              );
            });
          } else {
            $mdToast.show(
              $mdToast.simple()
                .textContent('Unable to geocode venue location')
                .hideDelay(3000)
            );
          }
        });
    },function() {
      // Dialog cancelled
    });
  }

  // Handler for config dialog events
  function DialogController($scope, $mdDialog, localConfig, localVenue) {
    $scope.config = localConfig;
    $scope.venue = localVenue;
    $scope.seperatorKeys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA];

    if (!$scope.venue.rooms) {
      $scope.venue.rooms = [];
    }

    $scope.onConfigItemChanged = function() {
      $scope.config.$save();
    }

    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.save = function() {
      $mdDialog.hide($scope.venue);
    };

    $scope.close = function() {
      $mdDialog.cancel();
    }
  }

  // create an instance of the authentication service
  var auth = $firebaseAuth();
  auth.$onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser == null) return;

    // Fetch firebase data
    $scope.profiles = ProfileList();
    $scope.submissions = SubmissionList();
    $scope.acceptedSubmissions = AcceptedSubmissions();
    $scope.schedule = SessionList();
    $scope.feedback = Feedback();

    // Schedule mapped by start time for UI
    $scope.scheduleMap = {};
    $scope.timeSlots = [];
    $scope.schedule.$watch(function() {
      $scope.scheduleMap = {};
      $scope.timeSlots = [];
      angular.forEach($scope.schedule, function(item) {
        // Check if key exists first
        if (!(item.start_time in $scope.scheduleMap)) {
          $scope.scheduleMap[item.start_time] = [];
          $scope.timeSlots.push(item.start_time);
        }

        $scope.scheduleMap[item.start_time].push(item);
      })
    });

    //Count of accepted, but unscheduled sessions
    $scope.unscheduled = [];
    function UpdateUnscheduled() {
      $scope.unscheduled = [];
      angular.forEach($scope.acceptedSubmissions, function(item) {
        if (!$scope.schedule.$getRecord(item.$id)) {
          $scope.unscheduled.push(item);
        }
      });
    }
    $scope.schedule.$watch(UpdateUnscheduled);
    $scope.acceptedSubmissions.$watch(UpdateUnscheduled);

    // Compute reviewer data
    $scope.scores = {};
    $scope.submissions.$watch(function() {
      $scope.scores = {};
      angular.forEach($scope.submissions, function(submission) {
        ComputeReviewScore(submission, $scope.scores);
      })
    });

    // Cache avatar URLs
    $scope.avatarUrls = {};
    $scope.profiles.$loaded().then(function() {
      angular.forEach($scope.profiles, function(profile) {
        GetAvatarUrl(profile, $scope.avatarUrls);
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

  function GetAvatarUrl(profile, urls) {
    Avatar(profile.$id).$getDownloadURL().then(function(url) {
      urls[profile.$id] = url;
    }).catch(function(error){
      urls[profile.$id] = "/images/placeholder.png";
    });
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

  function sessionCountForSpeakerId(speaker_id) {
    var count = 0;
    for (var i = 0; i < $scope.submissions.length; i++) {
      var session = $scope.submissions[i];
      if (session.speaker_id === speaker_id) {
        count += 1;
      }
    }
    return count;
  }

  // export button functions
  $scope.exportProfiles = function() {
    var items = {};
    for (var i = 0; i < $scope.profiles.length; i++) {
      var profile = $scope.profiles[i];
      item = items[profile.$id] || {
        name: profile.name,
        email: profile.email,
        company: profile.company,
        twitter: profile.twitter,
        image: $scope.avatarUrls[profile.$id],
        session_count: sessionCountForSpeakerId(profile.$id)
      };
      items[profile.$id] = item;
    }

    return Object.values(items);
  };

  $scope.exportSchedule = function() {
    var exportList = [];
    for (var i = 0; i < $scope.acceptedSubmissions.length; i++) {
      var session = $scope.acceptedSubmissions[i];
      var speaker = $scope.profiles.$getRecord(session.speaker_id);
      var schedule = $scope.schedule.$getRecord(session.$id);
      exportList.push({
        name: speaker.name,
        email: speaker.email,
        twitter: speaker.twitter,
        image: $scope.avatarUrls[session.speaker_id],
        title: session.title,
        abstract: session.abstract,
        time: schedule ? schedule.start_time : "n/a",
        room: schedule ? schedule.room : "n/a"
      });
    }

    return exportList;
  };
});

/* Controller to list and manage speaker profiles */
app.controller("ProfileCtrl", function($scope, $firebaseArray, $mdDialog) {

  $scope.profileFilter = function(item) {
    var re = new RegExp($scope.profileFilterText, 'i');
    return !$scope.profileFilterText
            || re.test(item.name)
            || re.test(item.company);
  }

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

  // Handler for profile dialog events
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
      $mdDialog.cancel();
    };
  }
});

/* Controller to list and manage submission items */
app.controller("SubmissionCtrl", function($scope, $firebaseObject, $firebaseArray, $mdDialog, $mdToast, Session) {

  $scope.submissionFilter = function(item) {
    var re = new RegExp($scope.subFilterText, 'i');
    return !$scope.subFilterText
            || re.test($scope.profiles.$getRecord(item.speaker_id).name)
            || re.test(item.title)
            || re.test(item.abstract);
  }

  $scope.sortOptions = [
    {value: 'title', label: "Session Title"},
    {value: 'name', label: "Speaker Name"},
    {value: 'score', label: "Reviewer Score"},
    {value: 'duration', label: "Duration"},
    {value: 'accepted', label: "Accepted Status"}
  ];
  $scope.sortProperty = 'title';
  $scope.reverseSort = false;
  $scope.getSortParam = function(item) {
    switch ($scope.sortProperty) {
      case 'name':
        $scope.reverseSort = false;
        return $scope.profiles.$getRecord(item.speaker_id) ?
                $scope.profiles.$getRecord(item.speaker_id).name : "";
      case 'score':
        $scope.reverseSort = true;
        return $scope.scores[item.$id];
      case 'accepted':
        $scope.reverseSort = false;
        if (item.accepted) {
          return 0;
        } else { // False and undefined are treated the same
          return 1;
        }
      case 'duration':
        $scope.reverseSort = false;
        return item.duration;
      case 'title':
      default:
        $scope.reverseSort = false;
        return item.title;
    }
  }

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

  $scope.onTalkSelectionChanged = function(submissionItem) {
    if (!submissionItem.accepted) {
      // Delete any existing schedule information
      var session = Session(submissionItem.$id);
      session.$remove();
    }
    // Update the accepted state
    $scope.submissions.$save(submissionItem);
  }

  $scope.addSubmission = function(evt) {
    ShowEntryDialog(evt, null, null);
  };

  $scope.showSubmissionDetail = function(evt, submissionItem, profileItem) {
    ShowEntryDialog(evt, submissionItem, profileItem);
  }

  function ShowEntryDialog(evt, submissionItem, profileItem) {
    var submission = submissionItem || {};
    var scores = $scope.feedback.scores || {};
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'submission.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true,
      locals: {
        entry: submission,
        speaker: profileItem,
        feedback: scores[submission.$id],
        profiles: $scope.profiles
      }
    })
    .then(function(item) {
      if (item.$id) {
        // Save existing submission
        $scope.submissions.$save(item).then(function() {
          $mdToast.show(
            $mdToast.simple()
              .textContent('Submission Updated')
              .hideDelay(3000)
          );
        }).catch(function(error) {
          $mdToast.show(
            $mdToast.simple()
              .textContent('Error updating submission. Please try again later.')
              .hideDelay(3000)
          );
        });
      } else {
        // Add new submission
        $scope.submissions.$add(item).then(function() {
          $mdToast.show(
            $mdToast.simple()
              .textContent('Submission Added')
              .hideDelay(3000)
          );
        }).catch(function(error) {
          $mdToast.show(
            $mdToast.simple()
              .textContent('Error adding submission. Please try again later.')
              .hideDelay(3000)
          );
        });
      }
    },function() {
      // Dialog cancelled
    });
  }

  // Handler for entry dialog events
  function DialogController($scope, $mdDialog, entry, speaker, feedback, profiles) {
    $scope.entry = entry;
    $scope.speaker = speaker;
    $scope.feedback = feedback;
    $scope.speakers = profiles;

    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.close = function() {
      $mdDialog.cancel();
    };

    $scope.save = function(item) {
      if ($scope.submissionForm.$valid) {
        // Set multiSpeaker based on presenter names
        if (item.others) {
          item.multiSpeaker = true;
        } else {
          item.multiSpeaker = false;
        }
        $mdDialog.hide(item);
      }
    }
  }
});

/* Controller to manage talk schedule */
app.controller("ScheduleCtrl", function($scope, $mdDialog, $mdToast, Session, Config) {

  //Clean labels for each time slot
  $scope.getSlotLabel = function(dateString) {
    var d = new Date(dateString);
    return d.toLocaleTimeString();
  }

  //Show toast with scheduling status
  $scope.showScheduleStatus = function() {
    var message = "";
    var count = $scope.unscheduled.length;
    switch (count) {
      case 0:
        message = "Schedule is complete!"
        break;
      case 1:
        message = count+" talk left to schedule.";
        break;
      default:
        message = count+" talks left to schedule.";
        break;
    }

    $mdToast.show(
      $mdToast.simple()
        .textContent(message)
        .hideDelay(3000)
    );
  }

  //Collect speakers into single label
  $scope.getSpeakersLabel = function(scheduleItem) {
    var names = [];
    angular.forEach(scheduleItem.speakers, function(id) {
      names.push($scope.profiles.$getRecord(id).name);
    })

    return names.join(", ");
  }

  //Verify if multiple talks accepted by same speaker
  $scope.isSpeakerUnique = function(scheduleItem) {
    var count = 0;
    for (submission of $scope.acceptedSubmissions) {
      if (submission.speaker_id === scheduleItem.speaker_id) {
        count++;
      }
    }

    return count < 2;
  }

  //Create a new event for the schedule
  $scope.addEvent = function(evt) {
    ShowEventDialog(evt, null);
  }

  //Add a submission to the schedule
  $scope.scheduleSubmission = function(evt, submissionItem) {
    var sessionInfo = Session(submissionItem.$id);
    ShowScheduleDialog(evt, submissionItem, sessionInfo);
  }

  //Update schedule info for a submission
  $scope.updateScheduleItem = function(evt, scheduleItem) {
    switch (scheduleItem.event_type) {
      case 'session':
        var submissionItem = $scope.submissions.$getRecord(scheduleItem.submission_id);
        var sessionInfo = Session(scheduleItem.$id);
        ShowScheduleDialog(evt, submissionItem, sessionInfo);
        break;
      case 'event':
        ShowEventDialog(evt, scheduleItem);
        break;
      default:
        $mdToast.show(
          $mdToast.simple()
            .textContent('Invalid Schedule Item')
            .hideDelay(3000)
        );
    }
  }

  $scope.clearScheduleItem = function(scheduleItem) {
    $scope.schedule.$remove(scheduleItem);
  };

  function ShowScheduleDialog(evt, submissionItem, sessionInfo) {
    $mdDialog.show({
      controller: ScheduleDialogController,
      templateUrl: 'schedule.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true,
      locals: {
        config: $scope.config,
        rooms: $scope.venue.rooms,
        entry: submissionItem,
        profiles: $scope.profiles,
        session: sessionInfo
      }
    })
    .then(function(session){
      // Session saved
      sessionInfo.submission_id = submissionItem.$id;
      sessionInfo.event_type = 'session';
      // Convert timestamps back to strings, fixed for mobile TZ offset
      sessionInfo.start_time = moment(sessionInfo.start_time).format();
      sessionInfo.end_time = moment(sessionInfo.end_time).format();

      sessionInfo.$save().then(function() {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Schedule Updated')
            .hideDelay(3000)
        );
      }).catch(function(error) {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Error updating schedule. Please try again later.')
            .hideDelay(3000)
        );
      });
    },function() {
      // Dialog cancelled
    });
  }

  // Handler for schedule dialog events
  function ScheduleDialogController($scope, $mdDialog, config, rooms, entry, profiles, session) {

    $scope.startDate = config.event_dates[0]+"T"+"00:00:00"
    $scope.endDate = config.event_dates[config.event_dates.length-1]+"T"+"23:59:59"

    //Convert session params to date objects
    session.start_time = new Date(session.start_time);
    session.end_time = new Date(session.end_time);
    //Initialize the speaker list
    if (!session.speakers) {
      session.speakers = [entry.speaker_id];
    }

    $scope.entry = entry;
    $scope.session = session;
    $scope.profiles = profiles;

    $scope.roomOptions = rooms;

    $scope.levelOptions = [];
    for (var key in config.session_levels) {
      if (config.session_levels.hasOwnProperty(key)) {
        var next = {value: key, label: config.session_levels[key]};
        $scope.levelOptions.push(next);
      }
    }

    $scope.getSpeakerName = function(speaker_id) {
      return $scope.profiles.$getRecord(speaker_id).name;
    }

    $scope.isSpeakerSubmitter = function(speaker_id) {
      return (speaker_id == $scope.entry.speaker_id);
    }

    $scope.removeSpeaker = function(speaker_id) {
      var index = $scope.session.speakers.indexOf(speaker_id);
      if (index > -1) {
        $scope.session.speakers.splice(index, 1);
      }
    }

    $scope.addSpeaker = function(speaker_id) {
      $scope.session.speakers.push(speaker_id);
    }

    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.save = function(session) {
      if ($scope.sessionForm.$valid) {
        $mdDialog.hide(session);
      }
    }
  }

  function ShowEventDialog(evt, eventItem) {
    $mdDialog.show({
      controller: EventDialogController,
      templateUrl: 'event.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true,
      locals: {
        config: $scope.config,
        entry: eventItem
      }
    })
    .then(function(eventItem) {
      // Event saved
      eventItem.event_type = 'event';
      // Convert timestamps back to strings with mobile-friendly TZ offsets
      eventItem.start_time = moment(eventItem.start_time).format();
      eventItem.end_time = moment(eventItem.end_time).format();

      if (eventItem.$id) {
        $scope.schedule.$save(eventItem).then(function() {
          $mdToast.show(
            $mdToast.simple()
              .textContent('Event Updated')
              .hideDelay(3000)
          );
        }).catch(function(error) {
          $mdToast.show(
            $mdToast.simple()
              .textContent('Error updating event. Please try again later.')
              .hideDelay(3000)
          );
        });
      } else {
        $scope.schedule.$add(eventItem);
      }
    },function() {
      //Dialog cancelled
    })
  }

  // Handler for scheduled event dialog events
  function EventDialogController($scope, $mdDialog, config, entry) {

    $scope.startDate = config.event_dates[0]+"T"+"00:00:00"
    $scope.endDate = config.event_dates[config.event_dates.length-1]+"T"+"23:59:59"

    //Convert entry params to date objects
    if (entry) {
      entry.start_time = new Date(entry.start_time);
      entry.end_time = new Date(entry.end_time);
    }

    $scope.entry = entry;

    $scope.save = function(entry) {
      $mdDialog.hide(entry);
    }

    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };
  }
});

/* Controller to view session feedback */
app.controller("FeedbackCtrl", function($scope, $mdDialog, $mdToast, Feedback, Config) {

  function getFeedbackAverage(score_type) {
    var result = {}
    var sum = 0.0;
    var count = 0;
    // Iterate over sessions with feedback
    for (var key in $scope.feedback.scores) {
      if ($scope.feedback.scores.hasOwnProperty(key)) {
        // Iterate over each feedback item
        var feedbackItem = $scope.feedback.scores[key]
        for (var uid in feedbackItem) {
          if (feedbackItem.hasOwnProperty(uid)) {
            sum += feedbackItem[uid][score_type];
            count++;
          }
        }
      }
    }

    return sum / count;
  }

  $scope.getOverallAvg = function() {
    return getFeedbackAverage("overall");
  }

  $scope.getTechnicalAvg = function() {
    return getFeedbackAverage("technical");
  }

  $scope.getSpeakerAvg = function() {
    return getFeedbackAverage("speaker");
  }

  // Return an object of uids and amount of feedback for each
  function getFeedbackCounts() {
    var result = {}
    // Iterate over sessions with feedback
    for (var key in $scope.feedback.scores) {
      if ($scope.feedback.scores.hasOwnProperty(key)) {
        // Iterate over each feedback item
        var feedbackItem = $scope.feedback.scores[key]
        for (var uid in feedbackItem) {
          if (feedbackItem.hasOwnProperty(uid)) {
            if (result[uid] != undefined) {
              result[uid]++;
            } else {
              result[uid] = 1;
            }
          }
        }
      }
    }

    return result;
  }

  $scope.getSessionFeedbackCount = function() {
    return Object.keys($scope.feedback.scores).length;
  };

  $scope.getAttendeeFeedbackCount = function() {
    var result = getFeedbackCounts();
    return Object.keys(result).length;
  };

  $scope.getTotalFeedbackCount = function() {
    var result = getFeedbackCounts();
    var count = 0;
    for (var uid in result) {
      if (result.hasOwnProperty(uid)) {
        count += result[uid];
      }
    }

    return count;
  }

  $scope.showRaffleList = function(evt) {
    ShowRaffleDialog(evt);
  };

  function getRaffleList() {
    var names = [];
    for (var uid in $scope.feedback.users) {
      if ($scope.feedback.users.hasOwnProperty(uid)) {
        names.push($scope.feedback.users[uid]);
      }
    }

    shuffle(names);
    return names;
  }

  /**
   * Shuffles array in place. ES6 version
   */
  function shuffle(a) {
      for (let i = a.length; i; i--) {
          let j = Math.floor(Math.random() * i);
          [a[i - 1], a[j]] = [a[j], a[i - 1]];
      }
  }

  function ShowRaffleDialog(evt) {
    $mdDialog.show({
      controller: RaffleDialogController,
      templateUrl: 'raffle.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: evt,
      clickOutsideToClose:true,
      fullscreen: true,
      locals: {
        entries: getRaffleList()
      }
    })
  }

  function RaffleDialogController($scope, $mdDialog, entries) {
    $scope.entries = entries;

    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.close = function() {
      $mdDialog.cancel();
    };
  }
});
