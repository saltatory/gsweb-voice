var Capability = require('TwilioCapability');
var applicationSID = "AP3908a6ef66bf432998472952593d53e0";
var accountSID = "ACafeeac727f8a41f6803036f5c66c0227";
var authToken = "0fc218a05239b184fc2462988ebeefdb";

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

app.get('/twilio', function(req,res){
	console.log('Serving request for conference');
	console.log(req.param('CallSid'));
	console.log(req.param('AccountSid'));
	console.log(req.param('From'));
	console.log(req.param('To'));
	console.log(req.param('ForwardedFrom'));


	res.render('twilio',{
		token: token,
		callSid: req.param('CallSid'),
	});
});

	

app.listen(80);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
