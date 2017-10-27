# 360|Conferences Web App

This repository contains the web app used to manage event content for the
360|Conferences Android events. Once deployed, this app defines three routes:

- `<site-root>/index.html` - Speaker submission portal
- `<site-root>/review/index.html` - Session reviewer portal
- `<site-root>/admin/index.html` - Organizer admin portal

## Speaker Portal

This page allows external users to log in with their Google account, create a
speaker profile, and submit talk proposals. As long as the CFP remains open,
users can return to this site and edit/delete submission information. After the
CFP is closed, only accepted talks are editable and only non-accepted
talks can be deleted.

After the conference is over, session feedback for each accepted talk is
available to the users for review.

## Reviewer Portal

This page allows external users to anonymously review talk submissions. Talks
are presented with title/abstract information only, and users can score each
submission as well as optionally provide comments.

If users of the review portal have also submitted a talk, those submissions are
hidden so they cannot vote on their own content. Progress is saved, so users do
not need to complete all the reviews at once.

**NOTE:** *Currently, any external user with the link to this page can log in
and begin reviewing talks. This is not restricted to a specific set of users.*

## Admin Portal

This page enables the organizers of the event to review all the submitted
content, accept talks, build a schedule, and configure venue information. Only
user accounts defined by the app config as organizers may log into this part of
the app.

### Configuration interface

The following parameters can be modified using the config UI in the admin
interface:

- **CFP Open:** Speakers can add talk submissions while this option is enabled.
- **Reviews Open:** Reviewers can add scores/comments while this option is
  enabled.
- **Feedback Open:** Speakers can see their session feedback once this option
  is enabled.
- **Venue Info:** Name, phone, and address of the conference venue. Only visible
  in the mobile app.
- **Session Rooms:** Names of the rooms/spaces at the venue where sessions are
  held. Used by the schedule builder to assign talks to a room.

### Profile list

Review each profile created in the speaker portal. All profiles are listed here,
regardless of whether a talk has been submitted.

**NOTE:** *Currently, the admin interface cannot create a new profile. Users
must do this themselves.*

### Submission manager

Review and modify the content of each talk submission, as well as the associated
reviewer scores/comments. Submissions can be sorted by score, title, or name or
submitter. Use this interface to mark which submissions are accepted talks.

After the conference is over, session feedback scores are also visible here for
each accepted talk.

### Schedule creator

Assign time slots and locations to build the schedule. There are two supported
types of schedule items:

- **Session:** An accepted talk submission.
- **Event:** Non-session event, such as lunch or after parties.

For sessions, this interface also allows you to include additional co-presenters.
Each co-presenter must also create their own profile before they can be added to
the schedule.

## Site Configuration

Before deploying and testing the app, there are a few site-specific configuration
elements that need to be in place first:

1.  Customize the base URLs for the Firebase database (`EVENT_ID`) and
    Firebase storage (`AVATAR_URL`) in `factories.js`.

2.  Customize the values in `/js/config.js`.

3.  Create a `config` node at the root of your database URL with the following
    keys:

    - **admins:** List of Firebase Auth UIDs for each admin account.
    - **event_name:** Display name for the event.
    - **event_year:** Display year for the event.
    - **event_dates:** List of event dates in YYYY-MM-DD format.

    ```
    "config": {
      "admins": ["...", "...", "..."],
      "event_name": "360|Conferences",
      "event_year": "2018",
      "event_dates": ["2018-01-01", "2018-01-02"]
    }
    ```

    **NOTE:** *The data saved by the configuration UI is also stored in this node.*

4.  Provide the following image assets specific to your event:

    - `images/logo.png` - Small icon image.
    - `images/logo-banner.png` - Large image used in sidebar and login pages.

## Site Deployment

This project is intended to be deployed using Firebase Hosting. Execute
`firebase deploy` from the root directory to upload the site content and database
rules.

### Database Security

Security rules for the Firebase database are housed in `database.rules.json`.
These should be automatically applied when you run `firebase deploy`, but you
may need to enter them manually if hosting the site elsewhere.
