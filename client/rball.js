/* rball.js - main scripting page for the rball site */

// Accounts configuration; require a user name for all users
Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
});

// Routing package lets us appear to have multiple pages without the overhead (and context loss) of a new page load
Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

// Render this template in the "home" page
Router.route('/', function () {
  this.render('navbar', {
    to:"navbar"
  });
  this.render('home', {
    to:"main"
  });
  $("li.active").removeClass("active");
  $("#nav_home").addClass("active");
});

// Render this template in the "about" page
Router.route('/about', function () {
  this.render('navbar', {
    to:"navbar"
  });
  this.render('about', {
    to:"main"
  });
  $("li.active").removeClass("active");
  $("#nav_about").addClass("active");
});

// Render this template in the "settings" page
Router.route('/settings', function () {
  this.render('navbar', {
    to:"navbar"
  });
  this.render('settings', {
    to:"main"
  });
  $("li.active").removeClass("active");
  $("#nav_settings").addClass("active");
});

// Helper functions (providing {{var}} support) for home template
Template.home.helpers({
    roundEnds:function(){
        if (Settings.findOne() == null)
            return "Sometime soon";
        return (Settings.findOne().roundEnds).toDateString();
    },
    roundMsg:function(){
        if (Settings.findOne() == null)
            return "";
        return Settings.findOne().roundMsg;
    },
    activeUser:function(){
        if (Meteor.user()){
            return Meteor.user().active;
        }
        return false;
    }
});

// Helper functions (providing {{var}} support) for activePlayers template
Template.activePlayers.helpers({
    players:function(){
        var p = Meteor.users.find({active:1},{sort: {points: -1}}).fetch();
        for (var ix = 0; ix < p.length; ix++) {
            p[ix].email = p[ix].emails[0].address;
        }
        return p;
    }
});

// Function used in the enterResults helper - to get the right "selector index" for a given persisted result
function resultStringToSelectorIx (str) {
    switch (str) {
        case null:
        case "":
            return 0;
        case "W":
            return 1;
        case "L":
            return 2;
        case "WF":
            return 3;
        case "LF":
            return 4;
        case "T":
            return 5;
    }
}

// Function used in the enterResults helper - when entering a result for playerA, enter opposite result for player B
function oppositeResult (str) {
    switch (str) {
        case null:
        case "":
            return "";
        case "W":
            return "L";
        case "L":
            return "W";
        case "WF":
            return "LF";
        case "LF":
            return "WF";
        case "T":
            return "T";
    }
}

// Function used in the enterResults helper - see if a player has played required matches (so eligable for a bonus match)
function playedRequiredMatches(user) {
    if ((user.profile.aboveResult != null) && (user.profile.belowResult != null) &&
            (user.profile.aboveResult != "") && (user.profile.belowResult != ""))
        return true;
    return false;
}

// Helper functions (providing {{var}} support) for enterResults template
Template.enterResults.helpers({
    above:function(){
        var user = Meteor.users.findOne ({_id:Meteor.user().aboveUser});
        if (user == null)
            return "";
        return user.username;
    },
    below:function(){
        var user = Meteor.users.findOne ({_id:Meteor.user().belowUser});
        if (user == null)
            return "";
        return user.username;
    },
    aboveIx:function(){
        if (Meteor.user().profile.aboveResult == null)
            return 0;
        return resultStringToSelectorIx (Meteor.user().profile.aboveResult);
    },
    belowIx:function(){
        if (Meteor.user().profile.belowResult == null)
            return 0;
        return resultStringToSelectorIx (Meteor.user().profile.belowResult);
    },
    bonusIx:function(){
        if (Meteor.user().profile.bonusResult == null)
            return 0;
        return resultStringToSelectorIx (Meteor.user().profile.bonusResult);
    },
    bonusUsers:function() {
         var user = Meteor.user();

         if (user.profile.bonusUser != null) {
            var u = Meteor.users.findOne ({_id:user.profile.bonusUser});
            if (u != null) {
                return [{username:u.username}];
            }
        }

        if (playedRequiredMatches(user)) {
            var bonusUsers = [];
            var activeUsers = Meteor.users.find ({_id:{$ne:user._id}, active:1}).fetch();
            for (var ix = 0; ix < activeUsers.length; ix++) {
                if (playedRequiredMatches(activeUsers[ix]))
                    bonusUsers = bonusUsers.concat(activeUsers[ix]);
            }
            if (bonusUsers.length > 0) {
                return [{username:""}].concat(bonusUsers);
            }
        }

        return [{username:"Not available"}];
    },
    bonusUserIx:function() {
        return 0;
    }
});

// Event handler for enterResults template - updates this user and the user they played (with opposite results)
Template.enterResults.events({
    'click #submit_results': function(event){
        var resultStatus = "";
        var user = Meteor.user();
        
        var above = document.getElementById("above_result");
        var aboveResult = above.options[above.selectedIndex].text;
        if (user.profile.aboveResult != aboveResult) {
            resultStatus += "Above changed to " + aboveResult + ". ";
            Meteor.users.update ({_id:user._id}, {$set: {"profile.aboveResult": aboveResult}});
            Meteor.users.update ({_id:user.aboveUser}, {$set: {"profile.belowResult": oppositeResult(aboveResult)}});
        }
        
        var below = document.getElementById("below_result");
        var belowResult = below.options[below.selectedIndex].text;
        if (user.profile.belowResult != belowResult) {
            resultStatus += "Below changed to " + belowResult + ". ";
            Meteor.users.update ({_id:user._id}, {$set: {"profile.belowResult": belowResult}});
            Meteor.users.update ({_id:user.belowUser}, {$set: {"profile.aboveResult": oppositeResult(belowResult)}});
        }

        var bonusUserSelector = document.getElementById("bonus_user");
        var bonusUserName = bonusUserSelector.options[bonusUserSelector.selectedIndex].text;
        var bonusUser = Meteor.users.findOne ({username:bonusUserName});
        var bonusResultSelector = document.getElementById("bonus_result");
        var bonusResult = bonusResultSelector.options[bonusResultSelector.selectedIndex].text;
        if ((bonusUser != null) && (user.profile.bonusResult != bonusResult)) {
            resultStatus += "Bonus against " + bonusUserName + " changed to " + bonusResult + ".";
            var bonusUserId = bonusUser._id;
            Meteor.users.update ({_id:user._id}, {$set: {"profile.bonusUser": bonusUserId}});
            Meteor.users.update ({_id:user._id}, {$set: {"profile.bonusResult": bonusResult}});
            Meteor.users.update ({_id:bonusUserId}, {$set: {"profile.bonusUser": user._id}});
            Meteor.users.update ({_id:bonusUserId}, {$set: {"profile.bonusResult": oppositeResult(bonusResult)}});
        }

        if (resultStatus.length <= 1)
            resultStatus = "Nothing changed"

        document.getElementById("submit_results_status").innerHTML = resultStatus;
    }
});

// Helper functions (providing {{var}} support) for settings template
Template.settings.helpers({
    activeNextRoundIx:function () {
        return 1; // - Meteor.user().profile.activeNextRound;
    },
    username:function(){
        return Meteor.user().username;
    },
    email:function(){
        return Meteor.user().emails[0].address;
    },
    admin:function(){
        return Meteor.user().admin;
    }
});

// Event handler for settings template - updates settings
// TODO; not yet working (getting permissions error and need to fix)
Template.settings.events({
    'click #submit_settings': function(event){
        var settingsStatus = "";
        var user = Meteor.user();
        var userId = user._id;
        var changes = "";

        var newUserName = document.getElementById("new_username").value;
        var newEmail = document.getElementById("new_email").value;
        var newActive = 1 - document.getElementById("new_active").selectedIndex;
        
        if ((newUserName != user.username) && (newUserName.length > 2)) {
            settingsStatus += "New user name " + newUserName + ". ";
            changes += "username:" + newUserName;
        }

        if ((newEmail != user.emails[0].address) && (newEmail.length > 10)) {
            settingsStatus += "New email address " + newEmail + ". ";
            if (changes.length > 0)
                changes += ", ";
            changes += "emails[0].address:" + newEmail;
        }

        if (newActive != user.profile.activeNextRound) {
            settingsStatus += "New active " + newActive;
            if (changes.length > 0)
                changes += ", ";
            changes += "profile.activeNextRound:" + newActive;
        }

        if (settingsStatus.length <= 1) {
            settingsStatus = "Nothing changed";
        } else {
            console.log("About to call Meteor.users.update with " + changes)
            try {
                //Meteor.users.update({_id: userId}, {$set: {changes}})
            }
            catch (err) {
                settingsStatus = err.message;
            }
        }
        
        document.getElementById("submit_settings_status").innerHTML = settingsStatus;
        document.getElementById("submit_settings_status").innerHTML = "Update not implemented yet";
    }
});