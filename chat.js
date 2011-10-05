var twilio = require('twilio');
var TwilioCapability = require('TwilioCapability');
var jwt = require('jwt');

var accountSid  = "ACafeeac727f8a41f6803036f5c66c0227";
var applicationSid = "AP1acf396d05d6421da74cabd7b3bbd4ed";
var authToken = "0fc218a05239b184fc2462988ebeefdb";
var clientName = "test";

var capability = new TwilioCapability(accountSid, authToken);
capability.allowClientOutgoing(applicationSid);
capability.allowClientIncoming(clientName);

var token = capability.generateToken();

console.log(token);
