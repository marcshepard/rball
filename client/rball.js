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

// Render this template in the "home" page
Router.route('/player/:_id', function () {
  this.render('userProfile', {
    to: "main",
    data: function () {
      Meteor.subscribe("history", this.params._id);
      var user = Meteor.users.findOne(this.params._id);
      var history = History.find({ userId: this.params._id }, { sort: { roundSort: -1 } });
      return { user: user, history: history };
    }
  });
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
        var settings = Settings.findOne();
        if (settings == null)
            return "Sometime soon";
        return new Date(settings.roundEnds).toDateString();
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
        return Meteor.users.find({active:1},{sort:{rank:1}});
    },
    restingPlayers: function () {
        return Meteor.users.find({active:0},{sort:{"profile.name":1}});
    },
    showActivePlayers: function () {
        return Session.get("ShowActivePlayers");
    },
    showRestingPlayers: function () {
        return Session.get("ShowRestingPlayers");
    },
    admin: function () {
        return Meteor.user().admin;
    }
});

Template.activePlayers.events({
  "click .js-toggle-active-players": function (event) {
    if (Session.get("ShowActivePlayers") == 1)
      Session.set("ShowActivePlayers", 0);
    else
      Session.set("ShowActivePlayers", 1);
  },
  "click .js-toggle-resting-players": function (event) {
    if (Session.get("ShowRestingPlayers") == 1)
      Session.set("ShowRestingPlayers", 0);
    else
      Session.set("ShowRestingPlayers", 1);
  },
  "click .delete-resting-player": function (event) {
    Meteor.call("deleteUser", event.currentTarget.id);
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

function pointsFor (str) {
    switch (str) {
        case null:
        case "":
        case "LF":
            return -1.2;
        case "W":
        case "WF":
            return 1.1;
        case "L":
            return -1.1;
        case "T":
            return 0;
    }
}

function bonusPointsFor (str, rankDiff) {
    if ((str=="W") || (str=="WF")) {
        val = 1.1 + 0.1 * rankDiff;
        return (val > 0 ? val : 0);
    }
    return 0;
}

// Function used in the enterResults helper - see if a player has played required matches (so eligable for a bonus match)
function playedRequiredMatches(user) {
    if ((user.aboveUser != null) && (user.aboveResult == ""))
        return false;
    if ((user.belowUser != null) && (user.belowResult == ""))
        return false;
    return true;;
}

// Helper functions (providing {{var}} support) for enterResults template
Template.enterResults.helpers({
    above:function(){
        var user = Meteor.users.findOne ({_id:Meteor.user().aboveUser});
        if (user == null)
            return "";
        return user.profile.name;
    },
    aboveId: function () {
      var user = Meteor.users.findOne({ _id: Meteor.user().aboveUser });
      if (user == null)
        return "";
      return user._id;
    },
    below:function(){
        var user = Meteor.users.findOne ({_id:Meteor.user().belowUser});
        if (user == null)
            return "";
        return user.profile.name;
    },
    belowId: function () {
      var user = Meteor.users.findOne({ _id: Meteor.user().belowUser });
      if (user == null)
        return "";
      return user._id;
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

         if (user.bonusUser != "") {
            var u = Meteor.users.findOne ({_id:user.bonusUser});
            if (u != null) {
                return [{name:u.profile.name}];
            }
            console.warn ("Error: user " + user.profile.name + " has a bonusUser " + user.bonusUser + " but they don't have one.")
            return [{name:"Not available"}];
        }

        if (playedRequiredMatches(user)) {
            var bonusUsers = [];
            var activeUsers = Meteor.users.find ({_id:{$ne:user._id}, active:1}, {sort: {"profile.name": 1}}).fetch();
            for (var ix = 0; ix < activeUsers.length; ix++) {
                if (playedRequiredMatches(activeUsers[ix]) && (activeUsers[ix].bonusUser == "")) {
                    bonusUsers = bonusUsers.concat([{name:activeUsers[ix].profile.name}]);
                }
            }
            if (bonusUsers.length > 0) {
                return [{name:""}].concat(bonusUsers);
            }
        }

        return [{name:"Not available"}];
    },
    clearStatusResults:function() {
        document.getElementById("submit_results_status").innerHTML = "";
    }
});

Template.enterResults.onRendered(function(){
    this.autorun (function () {
        if (document.getElementById("above_result") != null)
            document.getElementById("above_result").selectedIndex = resultStringToSelectorIx (Meteor.user().aboveResult);
        if (document.getElementById("below_result") != null)
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
        var aboveResult = "";
        if (above != null)
            aboveResult = above.options[above.selectedIndex].text;
        
        var below = document.getElementById("below_result");
        var belowResult = "";
        if (below != null)
            belowResult = below.options[below.selectedIndex].text;
        
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
Template.newUserSettings.helpers({
    id:function(){
        if (Meteor.user == null) {
            return "???";
        }
        return Meteor.user()._id;
    },
});

// Helper functions for user settings
Template.userSettings.helpers({
    name:function(){
        return Meteor.user().profile.name;
    },
    email:function(){
        return Meteor.user().profile.email;
    },
    activeStatus:function() {
        return (Meteor.user().active == 1 ? "Active" : "Rest");
    }
});

// Event handler for settings template - updates settings
Template.userSettings.events({
    'click #submit_settings': function(event){
        var name = document.getElementById("new_username").value;
        var email = document.getElementById("new_email").value;
        var active = 1 - document.getElementById("new_active").selectedIndex;

        resultStatus = "";
        statusTag = document.getElementById("submit_settings_status");
        errorMsgPostfix = ". Refresh the browser to update the UI with the current round settings.";
        
        user = Meteor.user();
        if (user == null) {
            console.warn ("updateSettings called by anonymous user");
            statusTag.innerHTML = "Failed: You must be logged in to update your settings";
            return;
        }
        
        if (name != user.profile.name) {
            Meteor.users.update (user._id, {$set:{"profile.name":name}});
            resultStatus += "name, ";
        }
        
        if (email != user.profile.email) {
            Meteor.users.update (user._id, {$set:{"profile.email":email}});
            resultStatus += "email address, ";
        }
        
        if (active != user.profile.activeNextRound) {
            Meteor.users.update (user._id, {$set: {"profile.activeNextRound":active}});
            resultStatus += "next round active/rest status";
        }
        
        if (resultStatus.length <= 1) {
            statusTag.innerHTML = "Nothing changed";
            return;
        }
        
        statusTag.innerHTML = "Succesfully updated " + resultStatus;
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
        var pMatches = Meteor.users.find({active:1, aboveResult:{$ne:""}}).count();
        var nMatches = Meteor.users.find({active:1}).count() - 1;
        return pMatches + " of " + nMatches + " matches played (" + parseInt((pMatches * 100)/nMatches) + "%)"; 
    },
    nagMailLink: function () {
      if (Settings.findOne({}) == null)
        return "#";

      var pMatches = Meteor.users.find({active:1, aboveResult:{$ne:""}}).count();
      var nMatches = Meteor.users.find({active:1}).count() - 1;
      var roundStats = pMatches + " of " + nMatches + " matches played (" + parseInt((pMatches * 100)/nMatches) + "%)"; 
      var roundEnds = Settings.findOne({}).roundEnds;
      if (roundEnds != null)
          roundEnds = new Date(roundEnds).toDateString();
      var users = Meteor.users.find({active:1}).fetch();
      var to = "";
      for (var ix=0; ix<users.length; ix++) {
          to += (users[ix].profile.email + ";")
      }
      to += "msladder@microsoft.com";
      var subject = "MS racquetball ladder reminder";
      var body = "The current round ends on " + roundEnds + ". So far there have been " +
          roundStats + ". As a courtesy to other players and to avoid the no-play penalty, please " +
          "make sure to play your matches and send the results at http://rball.herokuapp.com " +
          "before the round ends."

      return "mailto:"+escape(to)+"?subject="+subject+"&body="+escape(body);
    },
    roundEnds: function () {
      var settings = Settings.findOne({});
      if (settings == null)
          return "";
      return new Date(settings.roundEnds).toDateString();
    },
    roundMsg: function () {
      var settings = Settings.findOne({});
      if (settings == null)
          return "";
      return settings.roundMsg;
    },
    numUnapprovedPlayers: function() {
        return Meteor.users.find({ approved: { $ne: 1 } }).count();
    },
    manageApprovals: function() {
        return Session.get("manageApprovals");
    },
    unapprovedPlayers: function () {
        Meteor.call("initializeNewUsers");
        var p = Meteor.users.find({ approved: { $ne: 1 } }, { sort: { "profile.name": 1 }, fields: { "profile.name": 1, "profile.email": 1 } }).fetch();
        for (var ix = 0; ix < p.length; ix++) {
            p[ix].playerId = p[ix]._id;
        }
        return p;
    }
});

// Event handler for admin settings template - updates admin settings
Template.adminSettings.events({
    'click #submit_round': function (event, template) {
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
    'mouseleave #submit_round': function(event){
        document.getElementById("submit_round_status").innerHTML = "";
    },
    'click #manage_approvals': function (event) {
        Session.set("manageApprovals", 1);
    },
    'click #hide_approvals': function (event) {
        Session.set("manageApprovals", 0);
    },
    'click .approve_user': function (event) {
        Meteor.call("approveUser", event.target.id, function (error, result) {
            if (error == null) {
                console.log(result);
            } else {
                alert (error.message);
            }
        });
    },
    'click .delete_user': function (event) {
        //console.log("delete user: event.target.id = " + event.target.id);
        Meteor.call("deleteUser", event.target.id, function (error, result) {
            if (error == null) {
                console.log(result);
                //document.getElementById("submit_round_status").innerHTML = result;
            } else {
                console.warn(error.message);
                //document.getElementById("submit_round_status").innerHTML = error.message + ". Refresh the browser to update the UI with the current round settings.";
            }
        });
    }
});

function updatedPlayer (user) {
  this.rank = parseInt(user.rank);
  if (this.rank == NaN) {
    Console.warn("updatedPlayer: non-int rank value for user " + user.profile.name + ": using 50");
    this.rank = 50;
  }
  this.points = parseFloat(user.points);
  if (this.points == NaN) {
    Console.warn("updatedPlayer: non-float points value for user " + user.profile.name + ": using 10");
    this.points = 10;
  }
  this.profile = user.profile;  // name, email, activeNextRound
  this.lastRound = user.lastRound;
  this.active = user.active;
  this.admin = user.admin;
  this.aboveUser = user.aboveUser;
  this.aboveResult = user.aboveResult;
  this.belowUser = user.belowUser;
  this.belowResult = user.belowResult;
  this.bonusUser = user.bonusUser;
  this.bonusResult = user.bonusResult;
  this.prevRank = user.prevRank;
  this.prevAboveResult = user.prevAboveResult;
  this.prevBelowResult = user.prevBelowResult;
  this.prevBonusResult = user.prevBonusResult;
  this.id = user._id;
  this._id = user._id;
  this.accountType = user.accountType;
};

updatedPlayer.prototype.newRound = function() {
    if (this.active) {
        roundEnds = new Date(Settings.findOne({}).roundEnds);
        this.lastRound = roundEnds.getMonth()+1 + "/" + roundEnds.getDate() + "/" + roundEnds.getYear() % 100;
        this.prevRank = this.rank;
        this.points = 99 - this.rank;

        this.prevAboveResult = "";
        if (this.aboveUser) {
            this.points += pointsFor(this.aboveResult);
            if (this.aboveResult == "")
                this.prevAboveResult = "NP" + "(" + Meteor.users.findOne(this.aboveUser).profile.name + ")";
            else
                this.prevAboveResult = this.aboveResult + "(" + Meteor.users.findOne(this.aboveUser).profile.name + ")";
        }
        this.prevBelowResult = "";
        if (this.belowUser) {
            this.points += pointsFor(this.belowResult);
            if (this.belowResult == "")
                this.prevBelowResult = "NP" + "(" + Meteor.users.findOne(this.belowUser).profile.name + ")";
            else
                this.prevBelowResult = this.belowResult + "(" + Meteor.users.findOne(this.belowUser).profile.name + ")";
        }
        this.prevBonusResult = "";
        if (this.bonusUser && this.bonusResult) {
            var rankDiff = this.rank - Meteor.users.findOne(this.bonusUser).rank;
            this.points += bonusPointsFor(this.bonusResult, rankDiff);
            this.prevBonusResult = this.bonusResult + "(" + Meteor.users.findOne(this.bonusUser).profile.name + ")";
        }
        
        this.points = this.points.toFixed(1);
        this.rank = -1;
        this.aboveUser = "";
        this.aboveResult = "";
        this.belowUser = "";
        this.belowResult = "";
        this.bonusUser = "";
        this.bonusResult = "";
    }
    this.active = this.profile.activeNextRound;

    this.points = parseFloat(this.points);
};

var newRoundPlayers;

function currentRound() {
  var settings = Settings.findOne({});
  if (settings == null) {
    console.log("currentRound returning true because can't find settings...");
    return true;
  }

  var currentRoundEnds = new Date(settings.roundEnds);
  tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (currentRoundEnds > tomorrow)
    return true;
  return false;
}

Template.newRound.helpers ({
  generateNewRound: function() {
    return Session.get("generateNewRound");
  },

  activePlayers: function () {
    activeUsers = Meteor.users.find({ $or: [{ "profile.activeNextRound": 1 }, { "active": 1 }] }).fetch();

    newRoundPlayers = new Mongo.Collection(null);
    for (var ix = 0; ix < activeUsers.length; ix++) {
      var player = new updatedPlayer(activeUsers[ix]);
      if (!currentRound()) {
        player.newRound();
      } else if (player.active != player.profile.activeNextRound) {
        player.active = player.profile.activeNextRound;
      }
      newRoundPlayers.insert(player);
    }

    return newRoundPlayers.find({ deleteMe: { $ne : 1 } , "profile.activeNextRound" : 1}, { sort : { points : -1 } });
  },

  incr: function (val) {
    return val + 1;
  },

  newRoundEnds: function () {
    var settings = Settings.findOne();
    if (settings == null)
      return "";

    if (currentRound())
      return settings.roundEnds;
      
    var newDate = new Date(settings.roundEnds);
    newDate.setDate(newDate.getDate() + 14);
    return newDate.toDateString();
  },

  newRoundMsg: function () {
    var settings = Settings.findOne();
    if (settings == null)
      return "";

    if (currentRound())
      return settings.roundMsg;

    return "";
  },

  activeUser: function () {
    return Meteor.user().active;
  }
});

Template.newRound.events({
  'click #generate_new_round': function (event) {
      Session.set("generateNewRound", 1);
  },

  'click #hide_new_round': function (event) {
      Session.set("generateNewRound", 0);
  },

  'keypress .new_round_points': function (event) {
    if (event.keyCode != 13)
      return;

    var id = event.target.id.replace("pts_", "");
    var val = event.target.value;

    //console.log("Getting ready to update user " + id + " with new points value " + val);

    if ((val.length < 10) && !isNaN(parseFloat(val))) {
      // If new points were entered, update newRoundPlayer points
      p = parseFloat(val);
      newRoundPlayers.update({ _id: id }, { $set: { points: p } });
    } else if (val == "DEL") {
      // If DEL was entered, mark user for deletion
      newRoundPlayers.update({ _id: id }, { $set: { deleteMe: 1 } });
    } else if (val == "REST") {
      // If REST was entered, mark user for resting next round
      newRoundPlayers.update({ _id: id }, { $set: { active:0, "profile.activeNextRound": 0 } });
    } else if (newRoundPlayers.findOne({ _id: val }) != null) {
      // If another players ID was entered, copy that other players data and delete this player
      newUserId = val;
      oldUser = newRoundPlayers.findOne({ _id: id });
      if (newUserId != id) {
        newRoundPlayers.update({ _id: newUserId }, {$set: {
          active:oldUser.active,
          approved:oldUser.approved,
          admin: oldUser.admin,
          points: parseFloat(oldUser.points),
          rank: oldUser.rank,
          lastRound: oldUser.lastRound,
          prevRank: oldUser.prevRank,
          prevAboveResult: oldUser.prevAboveResult,
          prevBelowResult: oldUser.prevBelowResult,
          prevBonusResult: oldUser.prevBonusResult,
          "profile.name": oldUser.profile.name,
          "profile.email": oldUser.profile.email,
          "profile.activeNextRound": oldUser.profile.activeNextRound
        }
        });

        newRoundPlayers.update({ _id: id }, { $set: { "deleteMe": 1 } });
      }
    } else {
      // Invalid input - just ignore.
    }
  },

  'click #submit_new_round': function (event) {
    var newRoundEnds = document.getElementById("new_round_ends").value;
    var newRoundMsg = document.getElementById("new_round_msg").value;

    Meteor.call("startNewRound", newRoundPlayers.find({}).fetch(), newRoundEnds, newRoundMsg, function (error, result) {
      if (error != null) {
        alert (error.message);
      } else {
        alert(result);
      }
    });
    Session.set("generateNewRound", 0);
  },
});
