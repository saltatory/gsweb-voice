  $(document).ready(function(){
    Twilio.Device.setup("<?php echo $token->generateToken();?>");

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

