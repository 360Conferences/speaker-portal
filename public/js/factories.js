/*
 * Module for model factories
 */
angular.module("conference.model", []);

// Database constant values
var EVENT_ID = "events/360andev-2017"
var CONFIG_URL = EVENT_ID + "/config";
var VENUE_URL = EVENT_ID + "/venue";
var PROFILE_URL = EVENT_ID + "/profiles";
var SUBMISSION_URL = EVENT_ID + "/submissions";
var SESSION_URL = EVENT_ID + "/schedule";
var FEEDBACK_URL = EVENT_ID + "/feedback";
// Storage constant values
var AVATAR_URL = "2017/profiles";

// Retrieve the app config object
angular.module("conference.model").factory("Config", ["$firebaseObject",
  function($firebaseObject) {
    return function() {
      var ref = firebase.database().ref(CONFIG_URL);

      return $firebaseObject(ref);
    }
  }
]);

// Retrieve venue info object
angular.module("conference.model").factory("Venue", ["$firebaseObject",
  function($firebaseObject) {
    return function() {
      var ref = firebase.database().ref(VENUE_URL);

      return $firebaseObject(ref);
    }
  }
]);

// Retrieve feedback info object
angular.module("conference.model").factory("Feedback", ["$firebaseObject",
  function($firebaseObject) {
    return function() {
      var ref = firebase.database().ref(FEEDBACK_URL);

      return $firebaseObject(ref);
    }
  }
]);

// Pass in a uid and get back their synchronized data
angular.module("conference.model").factory("Profile", ["$firebaseObject",
  function($firebaseObject) {
    return function(uid) {
      var ref = firebase.database().ref(PROFILE_URL);
      if (uid) {
        var profileRef = ref.child(uid);
        return $firebaseObject(profileRef);
      } else {
        // Return the root profile object
        return $firebaseObject(ref);
      }
    }
  }
]);

// Retrieve all profiles
angular.module("conference.model").factory("ProfileList", ["$firebaseArray",
  function($firebaseArray) {
    return function() {
      var ref = firebase.database().ref(PROFILE_URL);
      var query = ref.orderByChild("name");

      return $firebaseArray(query);
    }
  }
]);

// Pass in a uid and get back their profile image
angular.module("conference.model").factory("Avatar", ["$firebaseStorage",
  function($firebaseStorage) {
    return function(uid) {
      var ref = firebase.storage().ref(AVATAR_URL);
      var avatarRef = ref.child(uid);

      return $firebaseStorage(avatarRef);
    }
  }
]);

// Return a single submission item
angular.module("conference.model").factory("Submission", ["$firebaseObject",
  function($firebaseObject) {
    return function(id) {
      var ref = firebase.database().ref(SUBMISSION_URL);
      if (id) {
        var entryRef = ref.child(id);
        return $firebaseObject(entryRef);
      } else {
        // Return the root submissions object
        return $firebaseObject(ref);
      }
    }
  }
]);

// Retrieve all submissions for a single speaker/user
angular.module("conference.model").factory("UserSubmissions", ["$firebaseArray",
  function($firebaseArray) {
    return function(uid) {
      var ref = firebase.database().ref(SUBMISSION_URL);
      var query = ref.orderByChild("speaker_id").equalTo(uid);

      return $firebaseArray(query);
    }
  }
]);

// Retrieve all accepted submissions
angular.module("conference.model").factory("AcceptedSubmissions", ["$firebaseArray",
  function($firebaseArray) {
    return function() {
      var ref = firebase.database().ref(SUBMISSION_URL);
      var query = ref.orderByChild("accepted").equalTo(true);

      return $firebaseArray(query);
    }
  }
]);

// Retrieve all submissions
angular.module("conference.model").factory("SubmissionList", ["$firebaseArray",
  function($firebaseArray) {
    return function() {
      var ref = firebase.database().ref(SUBMISSION_URL);
      var query = ref.orderByChild("title");

      return $firebaseArray(query);
    }
  }
]);

// Retrieve a session schedule object
angular.module("conference.model").factory("Session", ["$firebaseObject",
  function($firebaseObject) {
    return function(uid) {
      var ref = firebase.database().ref(SESSION_URL);
      if (uid) {
        var sessionRef = ref.child(uid);
        return $firebaseObject(sessionRef);
      } else {
        // Return the root sessions object
        return $firebaseObject(ref);
      }
    }
  }
]);

// Retrieve all session objects
angular.module("conference.model").factory("SessionList", ["$firebaseArray",
  function($firebaseArray) {
    return function() {
      var ref = firebase.database().ref(SESSION_URL);

      return $firebaseArray(ref);
    }
  }
]);
