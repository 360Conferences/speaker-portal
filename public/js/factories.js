/*
 * Module for model factories
 */
angular.module("conference.model", []);

// Database constant values
var CONFIG_URL = `${window.__config.event}/config`;
var VENUE_URL = `${window.__config.event}/venue`;
var PROFILE_URL = `${window.__config.event}/profiles`;
var SUBMISSION_URL = `${window.__config.event}/submissions`;
var SESSION_URL = `${window.__config.event}/schedule`;
var FEEDBACK_URL = `${window.__config.event}/feedback`;
var FAVORITES_URL = `${window.__config.event}/favorites`;

var API_SPEAKERS = `${window.__config.event}/speakers`;
var API_SESSIONS = `${window.__config.event}/sessions`;

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
    return function(id) {
      var ref = firebase.database().ref(FEEDBACK_URL);
      if (id) {
        var scoresRef = ref.child("scores").child(id);
        return $firebaseObject(scoresRef);
      } else {
        // Return the root feedback object
        return $firebaseObject(ref);
      }
    }
  }
]);

// Retrieve the favorites for a given session id
angular.module("conference.model").factory("Favorites", ["$firebaseObject",
  function($firebaseObject) {
    return function(id) {
      var ref = firebase.database().ref(FAVORITES_URL);
      if (id) {
        var favRef = ref.orderByChild(id).equalTo(true);
        return $firebaseObject(favRef);
      } else {
        // Return the entire favorites set
        return $firebaseObject(ref);
      }
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
      var ref = firebase.storage().ref(window.__config.storage);
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

// Retrieve speakers API endpoint data
angular.module("conference.model").factory("SpeakerApi", ["$firebaseObject",
  function($firebaseObject) {
    return function() {
      var ref = firebase.database().ref(API_SPEAKERS);

      return $firebaseObject(ref);
    }
  }
]);

// Retrieve sessions API endpoint data
angular.module("conference.model").factory("SessionApi", ["$firebaseObject",
  function($firebaseObject) {
    return function() {
      var ref = firebase.database().ref(API_SESSIONS);

      return $firebaseObject(ref);
    }
  }
]);
