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
             "emails": 1,
             "username": 1,
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
             "prevBonusResult": 1
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
