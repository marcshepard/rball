// Accounts configuration - require a user name for all users

Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
});

// Routing 

Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

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

Template.activePlayers.helpers({
    players:function(){
        var p = Meteor.users.find({active:1},{sort: {points: -1}}).fetch();
        for (var ix = 0; ix < p.length; ix++) {
            p[ix].email = p[ix].emails[0].address;
        }
        return p;
    }
});

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

function playedRequiredMatches (user) {
    if ((user.profile.aboveResult != null) && (user.profile.belowResult != null) &&
            (user.profile.aboveResult != "") && (user.profile.belowResult != ""))
        return true;
    return false;
}

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

Template.enterResults.events({
    'click #submit_results': function(event){
        console.log ("Clicked...");
        var user = Meteor.user();
        
        var above = document.getElementById("above_result");
        var aboveResult = above.options[above.selectedIndex].text;
        if (user.profile.aboveResult != aboveResult) {
            console.log ("Setting above result to " + aboveResult);
            Meteor.users.update ({_id:user._id}, {$set: {"profile.aboveResult": aboveResult}});
            Meteor.users.update ({_id:user.aboveUser}, {$set: {"profile.belowResult": oppositeResult(aboveResult)}});
        }
        
        var below = document.getElementById("below_result");
        var belowResult = below.options[below.selectedIndex].text;
        if (user.profile.belowResult != belowResult) {
            console.log ("Setting below result to " + belowResult);
            Meteor.users.update ({_id:user._id}, {$set: {"profile.belowResult": belowResult}});
            Meteor.users.update ({_id:user.belowUser}, {$set: {"profile.aboveResult": oppositeResult(belowResult)}});
        }

        var bonusUserSelector = document.getElementById("bonus_user");
        var bonusUserName = bonusUserSelector.options[bonusUserSelector.selectedIndex].text;
        var bonusUser = Meteor.users.findOne ({username:bonusUserName});
        var bonusResultSelector = document.getElementById("bonus_result");
        var bonusResult = bonusResultSelector.options[bonusResultSelector.selectedIndex].text;
        if ((bonusUser != null) && (user.profile.bonusResult != bonusResult)) {
            console.log ("Setting bonus result against " + bonusUserName + " to " + bonusResult);
            var bonusUserId = bonusUser._id;
            Meteor.users.update ({_id:user._id}, {$set: {"profile.bonusUser": bonusUserId}});
            Meteor.users.update ({_id:user._id}, {$set: {"profile.bonusResult": bonusResult}});
            Meteor.users.update ({_id:bonusUserId}, {$set: {"profile.bonusUser": user._id}});
            Meteor.users.update ({_id:bonusUserId}, {$set: {"profile.bonusResult": oppositeResult(bonusResult)}});
        }
    }
});

Template.settings.helpers({
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