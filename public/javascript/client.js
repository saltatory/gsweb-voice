// Register the variable that will hold the Twilio Connection
var connection ;
	

  $(document).ready(function(){
		//Immediately set the status
		$('#status').text('Setting up');

		// TODO the token is set by the template
		console.log('Setting up Twilio with token ' + token);
    Twilio.Device.setup(token);

    Twilio.Device.ready(function (device) { 
      $('#status').text('Ready to join conference');
      Twilio.Device.connect({GUID:"de90c5d4-e180-ed18-3e0c-b8ab11231f87"}); 
		});
                        
    Twilio.Device.offline(function (device) { 
      $('#status').text('Connection offline');
    });
                        
    Twilio.Device.error(function (error) { 
      $('#status').text(error);
    });
                        
    Twilio.Device.connect(function (conn) { 
			connection = conn;
      $('#status').text("Successfully joined conference");
    });

    Twilio.Device.disconnect(function (conn) { 
      $('#status').text("Disconnected");
    });
                                
  });

