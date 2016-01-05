// Add user helper

Accounts.onCreateUser(function(options, user) {
	// We still want the default hook's 'profile' behavior.
    console.log ("creating user " + user.username);
    if (options.profile)
        user.profile = options.profile;
    else
        user.profile = {};

    // Default values for rball user extensions
    user.profile.activeNextRound = 0;
    user.approved = 0;
    user.admin = 0;
    user.active = 0;
    user.points = 75;
    user.rank = 100;
    user.aboveUser = null;
    user.belowUser = null;
    user.profile.bonusUser = null;
    user.profile.aboveResult = "";
    user.profile.belowResult = "";
    user.profile.bonusResult = "";

    user.prevRank = 0;
    user.prevAboveUserName = "";
    user.prevBelowUserName = "";
    user.prevBonusUserName = "";
    user.prevAboveResult = "";
    user.prevBelowResult = "";
    user.prevBonusResult = "";

    // Override default values depending on options

    if (options.points)
        user.points = options.points;

    if (options.active) {
        user.profile.activeNextRound = 1;
        user.active = 1;
        user.approved = 1;
    }

    if (options.admin)
        user.admin = 1;

    if (options.approved)
        user.approved = 1;

    return user;
});

// Start a new round
function startNewRound (msg, endDate) {
    // Error checking - must be admin, endDate must be in the future and later
    // than current round end date
    
    // Store players previous rank and results
    
    // Update players points

    // Update player active field
    
    // Compute new player ranks
    
    // Figure out who is above and below
    
    // Send email
}


var migrated_users = [
	{
		username: "Marc Shepard",
		email: "marcshep@microsoft.com",
		password: "",
		active: 1,
		points: 82.8,
		admin: 1
	},
	{
		username: "Steven Pratschner",
		email: "stephenpr@microsoft.com",
		password: "",
		active: 1,
		points: 86.8,
		admin: 1
	},
	{
		username: "Jessica Chen",
		email: "jlchen@email.wm.edu",
		password: "",
		active: 1,
		points: 86.2
	},
	{
		username: "Daniel Olewski",
		email: "danielol@microsoft.com",
		password: "",
		active: 1,
		points: 97
	},
	{
		username: "Lou Lucarelli",
		email: "louluc@microsoft.com",
		password: "",
		active: 1,
		points: 87
	},
	{
		username: "Lang Beeck",
		email: "langb@microsoft.com",
		password: "",
		active: 1,
		points: 78.8
	},
	{
		username: "Don Stanwyck",
		email: "don.stanwyck@microsoft.com",
		password: "",
		active: 1,
		points: 78.2
	},
	{
		username: "Oscar Cabrero Maldonado",
		email: "osac@microsoft.com",
		password: "",
		active: 1,
		points: 89.2
	},
	{
		username: "Joon Sinn",
		email: "joonsi@microsoft.com",
		password: "",
		active: 1,
		points: 98.2
	}	
];


// Startup

Meteor.startup(function () {
    console.log("Server is starting...");
	
	// Add default ladder configuration
    console.log("Settings count = " + Settings.find().count());
    if (Settings.find().count() == 0) {
        console.log("Initializing Settings...");
        var d = new Date("Jan 4, 2016");
        Settings.insert({
            roundEnds:d,
            roundMsg:"This round is an extra week due to the holidays."
        });
        console.log("Settings now has count = " + Settings.find().count());
    }
    console.log("Settings.roundEnds = " + Settings.findOne({}).roundEnds);
    console.log("Settings.roundMsg = " + Settings.findOne({}).roundMsg);

    // Add migrated users
    if (Meteor.users.find().count() < migrated_users.length) {
        // Add users and their scores
        for	(ix = 0; ix < migrated_users.length; ix++) {
            var user = migrated_users[ix];
            if (Accounts.findUserByUsername(user.username) == null) {
                var userId = Accounts.createUser(user);
                Accounts.addEmail(userId, user.email, true);
                Accounts.setPassword(userId, "password");
            }
        }
            
        // Update ranks and above/below links
        var users = Meteor.users.find({active:1},{sort: {points: -1}}).fetch();
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
                    "rank": rank,
                    "aboveUser": aboveUser,
                    "belowUser": belowUser
                }}
            );
        }        
	}	
        
    console.log("There are " + Meteor.users.find().count() + " users");
});
