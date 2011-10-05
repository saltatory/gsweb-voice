  $(document).ready(function(){
		//Immediately set the status
		$('#status').text('Setting up');

		// TODO the token is set by the template
		console.log('Setting up Twilio with token ' + token);
    Twilio.Device.setup(token);

    Twilio.Device.ready(function (device) { 
      $('#status').text('Ready to join conference');
      Twilio.Device.connect();
    });
                        
    Twilio.Device.offline(function (device) { 
      $('#status').text('Connection offline');
    });
                        
    Twilio.Device.error(function (error) { 
      $('#status').text(error);
    });
                        
    Twilio.Device.connect(function (conn) { 
      $('#status').text("Successfully joined conference");
    });

    Twilio.Device.disconnect(function (conn) { 
      $('#status').text("Disconnected");
    });
                                
  });

