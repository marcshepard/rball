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
             "profile": 1
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

// One user can set another users match results for matches they play against them
Meteor.users.allow({
    update:function(userId, doc, fields, modifier){
        currentUser = Meteor.user();
        
        //if (currentUser._id == userId)
        //    return false;
                
        if (fields.length > 1)
            return false;
        if (_.values(modifier).length != 1)
            return false;
        if (_.keys(_.values(modifier)[0]).length != 1)
            return false;
        var attribute = _.keys(_.values(modifier)[0])[0];

        if (attribute == "profile.aboveResult") {
            if (doc.aboveUser == currentUser._id) {
                console.log ("Modifying aboveResult on another user");
                return true;
            }
            return false;
        }

        if (currentUser._id == userId) {
            if ((attribute == "emails[0].address") || (attribute == "username")) {
                return true;
            }
            return false;
        }

        if (attribute == "profile.belowResult") {
            if (doc.belowUser == currentUser._id)
            {
                console.log ("Modifying belowResult on another user");
                return true;                
            }
            console.log ("Can't modify belowResult on a user you are not playing");
            return false;
        }

        
        if (attribute == "profile.bonusUser") {
            if ((doc.bonusUser == null) || (doc.bonusUser == "")) {
                console.log ("Modifying bonusUser on another user");
                return true;
            }
            console.log ("Can't set bonusUser on a user that has already played a bonus match");
            return false;
        }
        
        if (attribute == "profile.bonusResult") {
            if (doc.profile.bonusUser == currentUser._id) {
                console.log ("Modifying bonusResult on another user");
                return true;
            }
            console.log ("Can't set bonusResult on a user that is not playing a bonus match against you");
            return false;
        }
        
        return false;
    }
})

