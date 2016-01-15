/* collections.js - database config file for racquetball site */

// Global configuration settings
Settings = new Mongo.Collection("settings");

// Server enables client to see a subset of the databse; round settings and extended info about other users
if (Meteor.isServer) {
    Meteor.publish("userData", function () {
        return Meteor.users.find({},
            {fields: {
             "approved": 1,
             "admin": 1,
             "active": 1,
             "points": 1,
             "rank": 1,
             "aboveUser": 1,
             "belowUser": 1,
             "bonusUser": 1,
             "aboveResult": 1,
             "belowResult": 1,
             "bonusResult": 1,
             "profile": 1,
             "prevRank": 1,
             "prevAboveUserName": 1,
             "prevBelowUserName": 1,
             "prevBonusUserName": 1,
             "prevAboveResult": 1,
             "prevBelowResult": 1,
             "prevBonusResult": 1,
             "accountType": 1,
             "lastRound":1
            }});
    });
 
    Meteor.publish("settings", function () {
        return Settings.find({},
            {fields: {
             "roundEnds": 1,
             "roundMsg": 1
            }});
    });
};
if (Meteor.isClient) {
    Meteor.subscribe("userData");    
    Meteor.subscribe("settings");    
}

// Only admins can change settings
Settings.allow({
    update:function(userId, doc){
        if (Meteor.user.admin)
            return true;
        return false;
    },

	insert:function(userId, doc){
        if (Meteor.user.admin)
            return true;
        return false;
    },
 
    remove:function(userId, doc){
        if (Meteor.user.admin)
            return true;
		return false;
    }
})

// Don't let anyone delete a profile.name or profile.email (only creation and update operations are OK)
// This rule just adds to existing deny rules, so we only need to check for the case we care about
Meteor.users.deny({
  update: function (userId, doc, fields, modifier) {
    // This rule is N/A unless they are modifying the users profile
    var modifyingProfile = false;
    for (var ix = 0; ix < fields.length; ix++) {
        if (fields[ix] == "profile")
            modifyingProfile = true;
    }
    if (!modifyingProfile)
        return false;
    
    // If they are performing a delete operation, return true to deny it
    if (modifier.$unset != null) {
        console.warn ("Denying profile.$unset by userId " + userId);
        return true;
    }
    if (modifier.$rename != null) {
        console.warn ("Denying profile.$unsete by userId " + userId);
        return true;
    }
    
    // Else continue
    return false;
  }
});
