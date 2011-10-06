// Require http so we can make REST requests
var rest = require('restler');

// Twilio variables and includes
var Capability = require('TwilioCapability');
var applicationSID = "AP3908a6ef66bf432998472952593d53e0";
var accountSID = "ACafeeac727f8a41f6803036f5c66c0227";
var authToken = "0fc218a05239b184fc2462988ebeefdb";

// Conversations
var Conversations = [];

// GUIDs
var GUIDs = [] ;

// Generate a token
var c  = new Capability(accountSID, authToken);
c.allowClientOutgoing(applicationSID);
c.clientName="Jeff Hohenstein";
var token = c.generateToken();
console.log(token);
console.log(c);

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

app.get('/', function(req, res){
  res.render('index', {
    title: 'GameSpy Web Voice Chat',
		token: token,
  });
});

app.get('/token', function(req,res){
	res.json({token: token});
});

app.get('/twilio', function(req,res){
	console.log('Serving request for conference');

	var guid = req.param('GUID');
	console.log("GUID\t" + guid);

	var found = false;

	for(var g in GUIDs)
	{
		console.log(GUIDs[g]);
		if(GUIDs[g]==guid)
			found=true;
	}

	if(found)
	{
		res.render('twilio',{
			token: token,
			callSid: req.param('CallSid'),
			GUID: guid,
		});
	}
	else {
		res.render('GUIDNotFound',{
			token: token,
			GUID: guid,
		});
	}
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
	console.log("Updating participants list for conference" + conferenceSID);

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
	.on('complete',onUpdateParticipants(data)
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

	console.log(data);
	for(var c in data.conferences)
	{
		// Only look at in-progress conferences
		//if(data.conferences[c].status=='in-progress')
		if(true)
		{
			Conversations.push(
				{
					guid: data.conferences[c].friendly_name,
					conference: data.conferences[c]
				}
			);
		}
		else{
			console.log( 'Miss\t' + data.conferences[c].friendly_name ) ;
		}
	}

	// Fire off a series of searches for partipants in the conversation
	for(var c in Conversations)
	{
		updateParticipants(Conversations[c].conference.sid);
	}
		

	console.log("============================================================");
	console.log(Conversations);
	console.log("============================================================");
}

/**
 * Called when Twilio responds with a participant list
 * for a conversation
 */
function onUpdateParticipants(data,conferenceSID)
{
	// Find the matching conversation and set the list
	console.log(data);
}


setTimeout(updateConversations,10);

app.listen(80);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
