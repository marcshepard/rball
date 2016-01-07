/* startup.js - server-only scripting page for the rball site */

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

// Function to reset the database and populate with initial settings and users
function populateDB () {
    console.log("Initializing Settings...");
    Settings.remove({});
    Settings.insert({
        roundEnds:new Date("Jan 18, 2016"),
        roundMsg:""
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
        var userId = Accounts.createUser({username:attribs[username], email:attribs[email], password:"password", profile:{}});
        Accounts.addEmail(userId, attribs[email], true);
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
                "approved": 1,
                "active": 1,
                "profile.activeNextRound": 1,                
                "admin": attribs[admin],
                "rank": parseInt(attribs[rank]),
                "points": attribs[points],
                "profile.aboveResult": "",
                "profile.belowResult": "",
                "profile.bonusResult": "",
                "prevRank": attribs[lastrank],
                "prevAboveUserName": attribs[lastabove].replace(/^[^(]*\(/, "").replace(/\)/, ""),
                "prevBelowUserName": attribs[lastbelow].replace(/^[^(]*\(/, "").replace(/\)/, ""),
                "prevBonusUserName": attribs[lastbonus].replace(/^[^(]*\(/, "").replace(/\)/, ""),
                "prevAboveResult": attribs[lastabove].replace(/\(.*\)/, ""),
                "prevBelowResult": attribs[lastbelow].replace(/\(.*\)/, ""),
                "prevBonusResult": attribs[lastbonus].replace(/\(.*\)/, "")
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

Meteor.methods({
    // Send a match results email notification
    sendResults:function (opponentId, result) {
        console.log ("sendResults");
        
        // Let other method calls from the same client start running without waiting for the email sending to complete.
        this.unblock();
    
        var user = Meteor.users.findOne({_id:this.userId});
        var opponent = Meteor.users.findOne({_id:opponentId});
        var toAddr =  user.emails[0].address + ";" + opponent.emails[0].address;
        var summary = user.username + " reported a " + result + " against " + opponent.username;
        
        Email.send({
            to: toAddr,
            from: "msladder@microsoft.com",
            subject: "MS rball: " + summary,
            bcc: "msladder@microsoft.com",
            text: "This is an auto-generated email that " + summary + "."
        });
    }
})

// Startup code
// Currently does initial DB population if DB has not yet been populated (will remove that part after initial development)
Meteor.startup(function () {
    console.log("Server is starting...");
	
    // Populate the DB with initial data
    //populateDB();
});
