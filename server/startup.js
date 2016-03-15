/* startup.js - server-only scripting page for the rball site */

// Approve a user for play in the ladder and populate some data fields with defaults
function initializeUser (userId, approved) {
  console.log("Approving user " + userId);

  user = Meteor.users.findOne (userId);
  if (user == null) {
    throw new Meteor.Error ("Can't find userID " + userId, "Invalid user")        
  }
    
  var name = "";
  if ((user.profile != null) && (user.profile.name != null)) {
    name = user.profile.name;
  } else if (user.username != null) {
    name = user.username;
  } else if ((user.services != null) && (user.services.facebook != null)) {
    name = user.services.facebook.name;
  } else {
    console.warn ("Can't find name for userId " + userId);
  }
  console.log("   name = " + name);
    
  var email = "";
  if ((user.profile != null) && (user.profile.email != null)) {
    email = user.profile.email;
  } else if ((user.emails != null) && (user.emails[0] != null)) {
    email = user.emails[0].address;
  } else if ((user.services != null) && (user.services.facebook != null)) {
    email = user.services.facebook.email;
  } else {
    console.warn ("Can't find email for userId " + userId);
  }
  console.log("   email = " + email);

  Meteor.users.update({_id: userId}, {$set: {
    "approved": approved,
    "accountType": ((user.services != null) && (user.services.facebook != null)) ? "Facebook" : "Local",
    "active": 0,
    "profile.activeNextRound": approved,
    "profile.name": name,
    "profile.email": email,            
    "admin": 0,
    "rank": 100,
    "points": -1,
    "aboveResult": "",
    "belowResult": "",
    "bonusResult": "",
    "bonusUser":"",
    "prevRank": "",
    "prevAboveResult": "",
    "prevBelowResult": "",
    "prevBonusResult": ""
  }});
}
    
// Function to reset the database and populate with initial settings and users
function populateDB () {
  console.log("Initializing Settings...");
  Settings.remove({});
  Settings.insert({
    roundEnds:new Date("Jan 18, 2016"),
     roundMsg:"This sentance is testing admin-configurable per-round messages."
  });
  console.log("Settings.roundEnds = " + Settings.findOne({}).roundEnds);
  console.log("Settings.roundMsg = " + Settings.findOne({}).roundMsg);
    
  console.log("Initializing users...");
  Meteor.users.remove({});
  var userdata =
`1,99.1,Joon Sinn,1,,W(Chi),,joonsi@microsoft.com
2,97.2,Daniel Olewski,4,W(Pawel),W(Srinivas),,Daniel.Olewski@microsoft.com
3,97,Chi Ekeke,2,L(Joon),W(Pawel),,cekeke@microsoft.com
4,94,Srinivas Badrinarayanan,5,L(Daniel),W(Sathish),,srinivab@microsoft.com
5,93.8,Pawel Kadluczka,3,L(Chi),L(Daniel),,pawelka@microsoft.com
6,93,Sathish Venkat Rangam,6,L(Srinivas),W(Atul),,srangam@microsoft.com
7,,Tammarrian Rogers,,,,,trogers@microsoft.com
8,,Andy Woods,,,,,awoods@microsoft.com
9,,Oscar Cabrero Maldonado,,,,,osac@microsoft.com
10,,Vlad Alexandrov,,,,,vladalex@microsoft.com
11,,Carlos Apacible,,,,,carlosap@microsoft.com
12,91,Atul Katiyar,8,L(Satish),W(Kunal),,atul.katiyar2@gmail.com
13,,Vivek Ramaswamy,,,,,vivram@microsoft.com
14,90.2,Steve Thomas (SMDS),11,W(Steven),W(Lou),,sthoma@microsoft.com
15,89,Steven Pratschner,10,W(Kunal),L(Steve),L(Lou),stevenpr@microsoft.com,1
16,87.2,Lou Lucarelli,12,L(Steve),L(Iulian),W(Steven),louluc@microsoft.com
17,86.2,Jessica Chen,15,WF(Iulian),W(Mick),,jlchen@email.wm.edu
18,,Dukjin Kang,,,,,fromdj2k@gmail.com
19,85,Iulian Cociug,14,W(Lou),LF(Jessica),,iulico@microsoft.com
20,83.2,Eugene Frumkin,18,W(Marc),W(Mike),,efrumkin@hotmail.com
21,82,Marc Shepard,17,W(Mick),L(Eugene),,marcshep@microsoft.com,1
22,,Naji Ghazal,,,,,najig@microsoft.com
23,80.8,Mick McWilliams,16,L(Jessica),L(Marc),,mick_mcwilliams@msn.com
24,80,Mike Gutmann,19,L(Eugene),WF(Patrick),,mikeg@fringebits.com
25,78.2,Don Stanwyck,23,W(Alex),W(Shawn),,Don.Stanwyck@microsoft.com
26,78,Roshan Newa,21,WF(Patrick),L(Alex),,roshane@microsoft.com
27,77,Alex Semko,22,W(Roshan),L(Don),,asemko@microsoft.com
28,71.8,Christopher Chow,26,NP(Mark),,,topherjchow@hotmail.com
29,71.7,Mark Hogan,25,LF(Shawn),NP(Chistopher),,markhog@microsoft.com`;
  // Add users and their scores
  var rank=0;
  var points=1;
  var username=2;
  var lastrank=3;
  var lastabove=4;
  var lastbelow=5;
  var lastbonus=6;
  var email=7;
  var admin=8;
  var users = userdata.split ("\n");
  for (var ix=0; ix < users.length; ix++) {
      var attribs = users[ix].split(",");
      console.log ("Creating user " + attribs[username] + " " + attribs[email]);
      var profile = {};
        
      var userId = Accounts.createUser({username:attribs[username], email:attribs[email], password:"password", profile:{activeNextRound:1}});
      Accounts.addEmail(userId, attribs[email], true);
      initializeUser(userId, 1);
        
      //Accounts.setPassword(userId, "password");
      if ((attribs[admin]=="") || (attribs[admin]==null))
         attribs[admin] = 0;
        
      console.log ("Updating user attributes...");
      console.log ("  Last above = " + attribs[lastabove]);
      console.log ("    Name : " + attribs[lastabove].replace(/^[^(]*\(/, "").replace(/\)/, ""));
      console.log ("    result : " + attribs[lastabove].replace(/\(.*\)/, "").replace(/NP/,""));
      console.log ("    lastRank : " + attribs[lastrank])
      Meteor.users.update({_id: userId}, {$set:
        {
          "active": 1,
          "admin": attribs[admin],
          "rank": parseInt(attribs[rank]),
          "points": attribs[points],
          "prevRank": attribs[lastrank],
          "prevAboveResult": attribs[lastabove],
          "prevBelowResult": attribs[lastbelow],
          "prevBonusResult": attribs[lastbonus]
        }}
      );
  }
    
  // Update ranks and above/below links
  console.log ("Updating user above/below links...");
  var users = Meteor.users.find({active:1},{sort: {rank: 1}}).fetch();
  for (var ix = 0; ix < users.length; ix++) {
    var user = users[ix];
    var rank = ix+1;
    var aboveUser = null;
    var belowUser = null;
    if (ix > 0)
      aboveUser = users[ix-1]._id;
    if (ix < users.length - 1)
      belowUser = users[ix+1]._id;
    Meteor.users.update({_id: user._id}, {$set:
      {
        "aboveUser": aboveUser,
        "belowUser": belowUser
      }}
    );
  }
        
  console.log("There are " + Meteor.users.find().count() + " users");
}

function emailResults (opponent, result) {
  // Let other method calls from the same client start running without waiting for the email sending to complete.
  //this.unblock();
    
  var user = Meteor.user();
  var toAddr =  user.profile.email + ";" + opponent.profile.email;
  var summary = user.profile.name + " reported a " + result + " against " + opponent.profile.name;
    
  Email.send({
    to: toAddr,
    from: "msladder@microsoft.com",
    subject: "MS rball: " + summary,
    bcc: "msladder@microsoft.com",
    html: "This is an auto-generated email from http://rball.meteorapp.com, based on results submitted by " + user.profile.name
  });
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
  if ((user.aboveUser != null) && (user.aboveResult == ""))
     return false;
  if ((user.belowUser != null) && (user.belowResult == ""))
    return false;
  return true;;
}

function validateRoundSettingsChangeAllowed(roundEndDate, roundMsg) {
  user = Meteor.user();
  if (user == null) {
    console.warn("updateSettings called by anonymous user");
    throw new Meteor.Error("Must be logged in", "Invalid User")
  }
  if (user.admin != 1) {
    console.warn("updateSettings called by non-admin user " + user.name);
    throw new Meteor.Error("Must be an admin", "Invalid User")
  }

  var roundEnds = new Date(roundEndDate);
  if (roundEnds == "Invalid Date") {
    throw new Meteor.Error("Invalid date", "Invalid End Date");
  }
  var threeWeeksFromNow = new Date();
  threeWeeksFromNow.setDate(threeWeeksFromNow.getDate() + 21);
  var now = new Date();
  if (roundEnds < now) {
    throw new Meteor.Error("Can't be in the past", "Invalid End Date");
  }
  if (roundEnds > threeWeeksFromNow) {
    throw new Meteor.Error("Can't be > 3 weeks from today", "Invalid End Date");
  }

  return true;
}

// APIs that the client can call to make DB changes
Meteor.methods({
  // Called before starting a new round to ensure a consistent set of properties are set for all users
  initializeNewUsers: function () {
    if (Meteor.user().admin) {
      var users = Meteor.users.find({ approved: null }).fetch();
      for (var ix = 0; ix < users.length; ix++) {
        initializeUser(users[ix]._id, 0);
      }
      return "Done..."
    }
    throw new Meteor.Error("Non-admins can't do this", "Invalid User");
  },

  // Approve a user request to join the ladder, and send them confirmation email
  approveUser: function (id) {
    if (Meteor.user().admin) {
      Meteor.users.update({ _id: id }, { $set: { "approved": 1, "profile.activeNextRound": 1 } });
      user = Meteor.users.findOne({ _id: id });
      Email.send({
        to: user.profile.email,
        from: "msladder@microsoft.com",
        subject: "You have been approved/activated on the MS rball ladder",
        bcc: "msladder@microsoft.com",
        html: `Going forward you can use http://rball.meteorapp.com to manage your active/rest state, and when the next round starts see your scheduled matches and enter results.`
      });
      return "Done..."
    }
    throw new Meteor.Error("Non-admins can't do this", "Invalid User");
  },

  // Permanently delete a user from the ladder (remove all records - vs just changing rest/active status)
  deleteUser: function (id) {
    if (Meteor.user().admin) {
      Meteor.users.remove({ _id: id });
      History.remove({ userId: id });
      return "Done..."
    }
    throw new Meteor.Error("Non-admins can't do this", "Invalid User");
  },

  // Edit user properties - this is only used from browser javascript console (alternative interface to MongoDB shell)
  editUser: function (id, change) {
    if (Meteor.user().admin) {
      Meteor.users.update({ _id: id }, { $set: change });
      return "Done..."
    }
    throw new Meteor.Error("Non-admins can't do this", "Invalid User");
  },
        
  // Admins can update the current round settings (end date and round message).
  updateRoundSettings:function (roundEnds, roundMsg) {
    if (!validateRoundSettingsChangeAllowed(roundEnds, roundMsg)) {
      throw new Meteor.Error("Invalid settings", "Failed");
    }
    Settings.update ({}, {$set: {roundMsg:roundMsg, roundEnds:roundEnds}});
    return ("Settings updated succesfully");
  },

  // Lets a player update results, and automatically send email notifications    
  reportResults:function (aboveResult, belowResult, bonusUserName, bonusResult) {
      var resultStatus = "";
      var user = Meteor.user();
        
      console.log (user.profile.name + " calling reportResults with aboveResults = " + aboveResult + ", belowResult = " + belowResult + ", bonusResult = " + bonusResult + ", bonusUser = " + bonusUserName);
      if (user.aboveResult != aboveResult) {
          console.log ("above results changes - validing user...");
          var opponent = Meteor.users.findOne({_id:user.aboveUser});
          if ((opponent == null) || (opponent.belowUser != user._id)) {
              console.warn ("Throwing wrong user...");
              throw new Meteor.Error("Wrong above user", "Invalid results");
          }
          resultStatus += "Above changed to " + aboveResult + ". ";
          Meteor.users.update ({_id:user._id}, {$set: {"aboveResult": aboveResult}});
          Meteor.users.update ({_id:user.aboveUser}, {$set: {"belowResult": oppositeResult(aboveResult)}});
          emailResults (opponent, aboveResult);
      }
        
      if (user.belowResult != belowResult) {
          var opponent = Meteor.users.findOne({_id:user.belowUser});
          if ((opponent == null) || (opponent.aboveUser != user._id)) {
              console.warn ("Wrong below user...");
              throw new Meteor.Error("Wrong below user", "Invalid results");
          }
          resultStatus += "Below changed to " + belowResult + ". ";
          Meteor.users.update ({_id:user._id}, {$set: {"belowResult": belowResult}});
          Meteor.users.update ({_id:user.belowUser}, {$set: {"aboveResult": oppositeResult(belowResult)}});
          emailResults (opponent, belowResult);
      }

      var bonusUser = Meteor.users.findOne ({"profile.name":bonusUserName,active:1});
      if ((bonusUser != null) && (user.bonusResult != bonusResult)) {
          var bonusUserId = bonusUser._id;
          if ((user.bonusUser == "") && (!playedRequiredMatches(user))) {
              console.warn ("Reporting bonus without playing required matches...");
              throw new Meteor.Error("Can't score a bonus match until you have played your required matches", "Invalid results");                
          }
          if ((bonusUser.bonusUser == "") && !(playedRequiredMatches(user))) {
              console.warn ("Reporting bonus against player who has already had a bonus match...");
              throw new Meteor.Error("Can't score a bonus match until your opponent has played their required matches", "Invalid results");                
          }
          if ((user.bonusUser != "") && (bonusUserId != user.bonusUser)) {
              console.warn ("Attempting to report a 2nd bonus match oppontent...");
              throw new Meteor.Error("You can only report one bonus opponent per round", "Invalid results");
          }
          if ((bonusUser.bonusUser != "") && (bonusUser.bonusUser != user._id)) {
              console.warn ("Attempting to report a bonus match against an oppontent who has already played their bonus match...");
              throw new Meteor.Error("Your opponent has already scored a bonus match against someone else", "Invalid results");
          }
            
          resultStatus += "Bonus against " + bonusUserName + " changed to " + bonusResult + ".";
          Meteor.users.update ({_id:user._id}, {$set: {"bonusUser": bonusUserId}});
          Meteor.users.update ({_id:user._id}, {$set: {"bonusResult": bonusResult}});
          Meteor.users.update ({_id:bonusUserId}, {$set: {"bonusUser": user._id}});
          Meteor.users.update ({_id:bonusUserId}, {$set: {"bonusResult": oppositeResult(bonusResult)}});
          emailResults (bonusUser, bonusResult);
      }

      if (resultStatus.length <= 1)
          resultStatus = "Nothing changed"

      return resultStatus;
  },

  // Start a new round
  startNewRound: function (updatedPlayers, roundEnds, roundMsg) {
    console.log ("\n\nIn startNewRound...")

    // Validation: round settings are valid and we are an admin
    if (!validateRoundSettingsChangeAllowed(roundEnds, roundMsg)) {
      throw new Meteor.Error("Invalid settings", "Failed");
    }

    // Validation: All currently active players are in the updatedPlayers list
    updatedPlayerIds = {};
    for (var ix = 0; ix < updatedPlayers.length; ix++) {
      updatedPlayerIds[updatedPlayers[ix]._id] = 1;
    }
    activePlayers = Meteor.users.find({ active: 1 }).fetch();
    for (var ix = 0; ix < activePlayers.length; ix++) {
      var player = activePlayers[ix];
      if (updatedPlayerIds[player._id] != 1) {
        throw new Meteor.Error("Not all active players updated (missing " + player.profile.name + ")", "Invalid player list");
      }
    }

    // Perform the requested updates
    for (var ix = 0; ix < updatedPlayers.length; ix++) {
      var player = updatedPlayers[ix];

      if (player.deleteMe) {
        console.log("DELETEing player " + player.profile.name + " (" + player.accountType + " )");
        Meteor.users.remove (player._id);
      } else {
        console.log("Updating player " + player.profile.name + " (" + player.accountType + " )");
        // Update user
        Meteor.users.update(player._id, {
          $set: {
            rank: parseInt(player.rank),
            points: parseFloat(player.points),
            profile: player.profile,  // name, email, activeNextRound
            lastRound: player.lastRound,
            active: player.active,
            admin: player.admin,
            aboveUser: "",
            aboveResult: "",
            belowUser: "",
            belowResult: "",
            bonusUser: "",
            bonusResult: "",
            prevRank: player.prevRank,
            prevAboveResult: player.prevAboveResult,
            prevBelowResult: player.prevBelowResult,
            prevBonusResult: player.prevBonusResult
          }
        });
        // Add a user history record for the round (if it doesn't already exist)
        if (!History.findOne({ userId: player._id, roundEnds: player.lastRound })) {
          if (player.lastRound != null) {
            History.insert({
              userId: player._id,
              roundEnds: player.lastRound,
              roundSort: new Date(player.lastRound).getTime(),
              rank: player.prevRank,
              aboveResult: player.prevAboveResult,
              belowResult: player.prevBelowResult,
              bonusResult: player.prevBonusResult
            });
          }
        }
      }
    }
    
    // Update ranks and above/below links
    console.log("Updating user above/below links...");
    var users = Meteor.users.find({ active: 1 }, { sort: { points: -1 } }).fetch();
    for (var ix = 0; ix < users.length; ix++) {
      var user = users[ix];
      var rank = ix + 1;
      var aboveUser = null;
      var belowUser = null;
      if (ix > 0)
        aboveUser = users[ix - 1]._id;
      if (ix < users.length - 1)
        belowUser = users[ix + 1]._id;
      Meteor.users.update({ _id: user._id }, {
        $set:
          {
            rank: rank,
            aboveUser: aboveUser,
            belowUser: belowUser
          }
      });
    }
    
    // Update new round settings
    Settings.update({}, { $set: { roundMsg: roundMsg, roundEnds: roundEnds } });

    // TODO - prune old History items (cap by date or by # items/player?)

    // TODO - send new round email

    return ("New round created succesfully");
  }

})

// Startup code
// Currently does initial DB population if DB has not yet been populated (will remove that part after initial development)
Meteor.startup(function () {
    console.log("Server is starting...");
	
    // Populate the DB with initial data
    //populateDB();
});
