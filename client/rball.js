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
  this.render('home', {
    to:"main"
  });
  $("li.active").removeClass("active");
  $("#nav_home").addClass("active");
});

// Render this template in the "about" page
Router.route('/about', function () {
  this.render('about', {
    to:"main"
  });
  $("li.active").removeClass("active");
  $("#nav_about").addClass("active");
});

// Render this template in the "settings" page
Router.route('/settings', function () {
  this.render('settings', {
    to:"main"
  });
  $("li.active").removeClass("active");
  $("#nav_settings").addClass("active");
});

// Helper functions (providing {{var}} support) for home template
Template.home.helpers({
    roundEnds:function(){
        var settings =Settings.findOne();
        if (settings == null)
            return "Sometime soon";
        return (settings.roundEnds).toDateString();
    },
    roundMsg:function(){
        if (Settings.findOne() == null)
            return "";
        return Settings.findOne().roundMsg;
    },
    activeUser:function(){
        return Meteor.user().active;
    }
});

// Helper functions (providing {{var}} support) for activePlayers template
Template.activePlayers.helpers({
    players:function(){
        var p = Meteor.users.find({active:1},{sort: {rank: 1}}).fetch();
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
    if ((user.aboveResult != null) && (user.belowResult != null) &&
            (user.aboveResult != "") && (user.belowResult != ""))
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
    aboveResult:function(){
        var val = Meteor.user().aboveResult;
        return val;
    },
    belowResult:function(){
        var val = Meteor.user().belowResult;
        return val;
    },
    bonusUsers:function() {
         var user = Meteor.user();

         if (user.bonusUser != null) {
            var u = Meteor.users.findOne ({_id:user.bonusUser});
            if (u != null) {
                return [{username:u.username}];
            }
        }

        if (playedRequiredMatches(user)) {
            var bonusUsers = [];
            var activeUsers = Meteor.users.find ({_id:{$ne:user._id}, active:1}, {sort: {username: 1}}).fetch();
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
    clearStatusResults:function() {
        document.getElementById("submit_results_status").innerHTML = "";
    }
});

Template.enterResults.onRendered(function(){
    this.autorun (function () {
        document.getElementById("above_result").selectedIndex = resultStringToSelectorIx (Meteor.user().aboveResult);
        document.getElementById("below_result").selectedIndex = resultStringToSelectorIx (Meteor.user().belowResult);
        document.getElementById("bonus_result").selectedIndex = resultStringToSelectorIx (Meteor.user().bonusResult);
    });
});

// Event handler for enterResults template - updates this user and the user they played (with opposite results)
Template.enterResults.events({
    'mouseleave #submit_results': function(event){
        document.getElementById("submit_results_status").innerHTML = "";
    },            
    'click #submit_results': function(event){
        var above = document.getElementById("above_result");
        var aboveResult = above.options[above.selectedIndex].text;        
        var below = document.getElementById("below_result");
        var belowResult = below.options[below.selectedIndex].text;
        var bonusUserSelector = document.getElementById("bonus_user");
        var bonusUserName = bonusUserSelector.options[bonusUserSelector.selectedIndex].text;
        var bonusResultSelector = document.getElementById("bonus_result");
        var bonusResult = bonusResultSelector.options[bonusResultSelector.selectedIndex].text;
        Meteor.call ("reportResults", aboveResult, belowResult, bonusUserName, bonusResult, function (error, result) {
            if (error == null) {
                document.getElementById("submit_results_status").innerHTML = result;
            } else {
                document.getElementById("submit_results_status").innerHTML = error.message;
            }
        });
    }
});

// Helper functions (providing {{var}} support) for settings template
Template.settings.helpers({
    newUser:function() {
        return (Meteor.user().approved != 1);
    },
    admin:function(){
        return Meteor.user().admin;
    }
});

// Helper functions for user settings
Template.userSettings.helpers({
    name:function(){
        return Meteor.user().username;
    },
    email:function(){
        return Meteor.user().emails[0].address;
    },
    activeStatus:function() {
        return (Meteor.user().active == 1 ? "Active" : "Rest");
    }
});

// Event handler for settings template - updates settings
Template.userSettings.events({
    'click #submit_settings': function(event){
        var newUserName = document.getElementById("new_username").value;
        var newEmail = document.getElementById("new_email").value;
        var newActive = 1 - document.getElementById("new_active").selectedIndex;
        
        Meteor.call ("updateUserSettings", newActive, newUserName, newEmail, null, function (error, result) {
            if (error == null) {
                document.getElementById("submit_settings_status").innerHTML = result;
            } else {
                document.getElementById("submit_settings_status").innerHTML = error.message + ". Refresh the browser to update the UI with the current round settings.";
            }
        });
    },
    'mouseleave #submit_settings': function(event){
        document.getElementById("submit_settings_status").innerHTML = "";
    },    
});

Template.userSettings.onRendered(function(){
    this.autorun (function () {
        var ix = 1;
        if (Meteor.user().approved == 1) {
            try {
                ix = 1 - (Meteor.user().profile.activeNextRound == "1");
            } catch (e) {}
            document.getElementById("new_active").selectedIndex = ix;
        }
    });
});

// Helper functions (providing {{var}} support) for settings template
Template.adminSettings.helpers({
    roundStats: function () {
        var pMatches = Meteor.users.find({active:1, aboveResult :{$ne:""}}).count();
        var nMatches = Meteor.users.find({}).count() - 1;
        return pMatches + " of " + nMatches + " matches played (" + parseInt((pMatches * 100)/nMatches) + "%)"; 
    },
    nagMailLink: function() {
        var pMatches = Meteor.users.find({active:1, aboveResult :{$ne:""}}).count();
        var nMatches = Meteor.users.find({}).count() - 1;
        var roundStats = pMatches + " of " + nMatches + " matches played (" + parseInt((pMatches * 100)/nMatches) + "%)"; 
        var roundEnds = Settings.findOne({}).roundEnds.toDateString();
        var users = Meteor.users.find({active:1}).fetch();
        var to = "";
        for (var ix=0; ix<users.length; ix++) {
            to += (users[ix].emails[0].address + ";")
        }
        to += "msladder@microsft.com";
        var subject = "MS racquetball ladder reminder";
        var body = "The current round ends on " + roundEnds + ". So far there have been " +
            roundStats + ". As a courtesy to other players and to avoid the no-play penalty, please " +
            "make sure to play your matches and send the results at http://rball.meteor.com " +
            "before the round ends."
        return "mailto:"+escape(to)+"?subject="+subject+"&body="+escape(body);
    },
    roundEnds: function () {
        var settings = Settings.findOne();
        if (settings == null)
            return "";
        return settings.roundEnds.toDateString();
    },
    roundMsg: function () {
        var settings = Settings.findOne();
        if (settings == null)
            return "";
        return settings.roundMsg;
    },
    newRoundEnds: function () {
        var settings = Settings.findOne();
        if (settings == null)
            return "";
        var newDate = new Date(settings.roundEnds);
        newDate.setDate (newDate.getDate() + 14);
        return newDate.toDateString();
    },
    players: function () {
        var p = Meteor.users.find({}, {sort: {username: 1}, fields: {username: 1, approved: 1}}).fetch();
        return p;
    }
});

// Event handler for settings template - updates settings
Template.adminSettings.events({
    'click #submit_round': function (event, template) {
        // document.getElementById("submit_round_status").innerHTML = "Not implemented";
        roundEnds = document.getElementById("round_ends").value;
        roundMsg = document.getElementById("round_msg").value;
        Meteor.call ("updateRoundSettings", roundEnds, roundMsg, function (error, result) {
            if (error == null) {
                document.getElementById("submit_round_status").innerHTML = result;
            } else {
                document.getElementById("submit_round_status").innerHTML = error.message + ". Refresh the browser to update the UI with the current round settings.";
            }
        });
    },
    'click #submit_newround': function (event) {
        document.getElementById("submit_newround_status").innerHTML = "Not implemented";
    }
});
