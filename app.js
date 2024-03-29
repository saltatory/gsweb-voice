// Require http so we can make REST requests
var rest = require('restler');

// Twilio variables and includes
var Capability = require('TwilioCapability');
var applicationSID = "AP3908a6ef66bf432998472952593d53e0";
var accountSID = "ACafeeac727f8a41f6803036f5c66c0227";
var authToken = "0fc218a05239b184fc2462988ebeefdb";

// Conversations
var Conversations = [];
var Calls = [];

// GUIDs
var GUIDs = [] ;

/**
 * Generate GUIDs for conferences
 */
function generateGUID() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}


/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

// global controller
app.all('/*',function(req,res,next){
    res.header('Access-Control-Allow-Origin' , '*' );
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next(); // http://expressjs.com/guide.html#passing-route control
});

app.get('/', function(req, res){
  res.render('index', {
    title: 'GameSpy Web Voice Chat',
		token: token,
  });
});

// Render a simplified list of conversations (GUIDs) and participants


app.get('/token', function(req,res){
	res.json({token: token});
});

app.get('/twilio', function(req,res){
	console.log('Serving request for conference');

	var guid = req.param('GUID');
	var name = req.param('name');
	var sid = req.param('CallSid');
	console.log("GUID\t" + guid);
	console.log("Name\t" + name);
	console.log("SID\t" + sid);

	var found = false;

	for(var g in GUIDs)
	{
		if(GUIDs[g]==guid)
			found=true;
	}

	if(found)
	{
		res.render('twilio',{
			token: token,
			callSid: sid,
			GUID: guid,
		});
		registerCall(sid,name);
	}
	else {
		res.render('GUIDNotFound',{
			token: token,
			GUID: guid,
		});
	}
	// Trigger an update of the conversations
	updateConversations();
});

/**
 * Returns a GUID to a client
 * 
 * The client must pass the originating token for the
 * the server to agree this is a valid request
 * 
 * Expects {token} the originally generated Capability token
 */
app.get('/guid', function(req,res) {
	console.log('Servicing request for GUID');

	var guid = generateGUID();

	GUIDs.push(guid);
	
	res.json({GUID: guid});

	console.log("GUIDs");
	console.log("============================================================");
	console.log(GUIDs);
	console.log("============================================================");

});

/**
 * Return a list of conversations and the list of participants
 */
app.get('/list', function(req,res) {
//	console.log("Conversation List");
//	console.log(Conversations);
	res.json(simplifyConversations());
});

/**
 * When Twilio initiates a call, we want to track
 * the SID of the call and the name of the caller.
 */
function registerCall(sid,name)
{
	for( var c in Calls )
	{
		if( Calls[c].name == name)
		{
			//Update the existing call with the new sid
			Calls[c].sid = sid;
			return;
		}
	}
	Calls.push({sid: sid, name: name});

	console.log("Calls");
	console.log(Calls);
}

/**
 * Poll the Twilio server for status on conversations once every 5 seconds.
 */
function updateConversations()
{
	console.log("Updating conversation list from Twilio");

	var url = "https://" +
		"api.twilio.com/2010-04-01/Accounts/" +
		accountSID +
		"/Conferences" +
		".json";

	rest.get(url, {
		username: accountSID,
		password: authToken,
	})
	.on('complete',onUpdateConversations)
	.on('error',function(error){console.log(error)})
	;

}

/**
 * Ask twilio for participant list for a conversation
 */
function updateParticipants(conferenceSID)
{
	console.log("Updating participants list for conference " + conferenceSID);

	var url = "https://" +
		"api.twilio.com/2010-04-01/Accounts/" +
		accountSID +
		"/Conferences/" +
		conferenceSID +
		"/Participants.json"
		;

	rest.get(url, {
		username: accountSID,
		password: authToken,
	})
	.on('complete',onUpdateParticipants)
	.on('error',function(error){console.log(error)})
	;

}


/**
 * Callback function called when conversation data
 * comes back from Twilio
 */
function onUpdateConversations(data)
{

	// Overwrite the conversations object
	Conversations = [] ;

	for(var c in data.conferences)
	{
		// Only look at in-progress conferences
		if(data.conferences[c].status=='in-progress')
		//if(true)
		{
			Conversations.push(
				{
					guid: data.conferences[c].friendly_name,
					conference: data.conferences[c]
				}
			);
		}
		else{
//			console.log( 'Miss\t' + data.conferences[c].friendly_name ) ;
		}
	}

	// Fire off a series of searches for partipants in the conversation
	for(var c in Conversations)
	{
		updateParticipants(Conversations[c].conference.sid);
	}
		

/*
	console.log("============================================================");
	console.log(Conversations);
	console.log("============================================================");
*/
}

/**
 * Called when Twilio responds with a participant list
 * for a conversation
 */
function onUpdateParticipants(data)
{
	var parts = data.uri.split('/');
	var sid = parts[5];

	// Look through the conversations and update the participant list
	for( var c in Conversations )
	{
		if( Conversations[c].conference.sid==sid )
		{
			Conversations[c].Participants=data;
		}
	}	
}

/**
 * Generate a simplified list of conversations
 */
function simplifyConversations()
{
	var simplified = [] ;
	for( var c in Conversations )
	{
		var conv = {};
		conv.guid = Conversations[c].guid ;

		if( Conversations[c].Participants && Conversations[c].Participants.participants )
		{
			var participants = Conversations[c].Participants.participants ;
	
			conv.Participants = [];
	
			for( var p in participants )
			{
				var participant = participants[p];
				var sid = participant.call_sid;
				var simplifiedParticipant = {sid: sid, name: ""};
				// Attempt to get the name for the sid
				for(var call in Calls)
				{
					if(Calls[call].sid==sid)
					{
						simplifiedParticipant.name = Calls[call].name;
					}
				}
				conv.Participants.push(simplifiedParticipant);
			}
		}
		simplified.push(conv);
	}
	return simplified ;
}

/**
 * Generate a new Twilio token
 */
function generateToken()
{
	var c  = new Capability(accountSID, authToken);
	c.allowClientOutgoing(applicationSID);
	c.clientName="Jeff Hohenstein";
	token = c.generateToken();
	return token;
}

var token ;
generateToken();
console.log(token);
setInterval(updateConversations,1000);
setInterval(generateToken,2000000);


app.listen(80);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
