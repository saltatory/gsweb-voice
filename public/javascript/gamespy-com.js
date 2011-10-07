var keys = {};
var widgetShown = false;
var widgetTimeout = false;
var firstTime = true;
var numCalls = 0;

//stores guid of my current call
var myCall;

var userList = new Array();
var thisUser = 'Sean';
var connection;
var chatroomData;
var chatrooms = new Array();
var roomUserList = new Array();

var joinCall = function(guid)
{
	myCall = guid;
	Twilio.Device.connect({GUID:guid, name:thisUser});
	$('#button-container-' + guid).empty();
	$('#button-container-' + guid).append(getLeaveButton());
}

var getLeaveButton = function()
{
	return '<div id="leave-button" class="gs-button">Leave</div>';
}

var getJoinButton = function(guid)
{
	return '<div id="join-' + guid + '-button" onClick="joinCall(\'' + guid + 
					'\');" class="gs-button">Join</div>';
}

var getChatters = function()
{
	jQuery.getJSON('http://ec2-174-129-55-249.compute-1.amazonaws.com/list',
		function(data)
		{
			if(!data)
			{
				return;
			}

			chatroomData = data;
			var newGuids = new Array();
			chatroomData.forEach(function(room)
			{
				newGuids.push(room.guid);
			});
			newGuids.sort();
			chatrooms.sort();

			//if there is a new chatroom, add it.
			var i = 0;
			var j = 0;
			while (i < newGuids.length && j < chatrooms.length)
			{
				if(newGuids[i] == chatrooms[j])
				{
					i++;
					j++;
					continue;
				}
				//chatroom j no longer exists, remove it
				else if(newGuids[i] > chatrooms[j])
				{
					removeRoom(chatrooms[j]);
					j++;
				}
				//newGuids i is new! Add it!
				else if(newGuids[i] < chatrooms[j])
				{
					$('#voice-widget-body').addCall(newGuids[i]);
					i++;
				}
			}
			
			//make new rooms until we're done
			while(i < newGuids.length)
			{
				$('#voice-widget-body').addCall(newGuids[i]);
				i++;
			}
			//remove old rooms until we're done
			while(j < chatrooms.length)
			{
				removeRoom(chatrooms[j]);
				j++;
			}
			chatrooms = newGuids;
			

		});
}//getChatters()

var removeRoom = function(guid)
{
	$('#gs-call-' + guid).remove();
}

window.setInterval(getChatters, 5000);

//var host = "";
var host = "http://ec2-174-129-55-249.compute-1.amazonaws.com";
function loadCSSFile(filename)
{
	var fileref=document.createElement("link");
	fileref.setAttribute("rel", "stylesheet");
	fileref.setAttribute("type", "text/css");
	fileref.setAttribute("href", filename);
	if (typeof fileref!="undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref);
}

function loadJSFile(filename)
{
	var fileref=document.createElement('script');
	fileref.setAttribute("type","text/javascript");
	fileref.setAttribute("src", filename);
	if (typeof fileref!="undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref);
}

$(function()
{
	$.fn.loadHtml = function(){
		$.get(host + '/html/gamespy-com.html', function(data)
		{
			$('body').append(data);
		});
	}
});

$(document).ready(function() {

	
	//load the CSS
	loadCSSFile(host + '/stylesheets/gamespy-com.css');
	//load the HTML
	$(document).loadHtml();

	var token;
	var getToken = function()
	{
		jQuery.getJSON('http://ec2-174-129-55-249.compute-1.amazonaws.com/token',
			function(data)
			{
				Twilio.Device.setup(data.token);
			});
	}
		getToken();
		//initialize Twilio
		Twilio.Device.ready(function(device)
		{
		});
		Twilio.Device.error(function (error)
		{
			$('#talk-button').text("Error");
		});
		Twilio.Device.offline(function(conn)
		{
			$('#talk-button').text("Offline");
		});

	//logic to show/hide the widget when pressing Ctrl+V
	$(document).keydown(function(event){
		keys[event.which] = true;

		if(keys[17] && keys[86])
		{
			if(!widgetTimeout)
			{
				if(widgetShown)
				{
					$("#voice-widget-body").slideUp();
					widgetShown = false;
				}
				else
				{
					$("#voice-widget-body").slideDown();
					widgetShown = true;

					if(firstTime)
					{
						//remove these when you get the server reporting
						$('#voice-widget-users').addUser('Sean');
						firstTime = false;
					}
				}
				widgetTimeout = true;
			}
		}
	});

	$(document).keyup(function(event){
		keys[event.which] = false;
		if(!keys[86])
		{
			widgetTimeout = false;
		}
	});
			
	//sort the user list
	(function($) {
		$.fn.reOrder = function() {

			var array = new Array();

			$(this).children().each(function()
			{
				array.push($(this).attr('id'));
			});

			array.sort();

	  	return this.each(function() {

				for(var i=0; i < array.length; i++)
					array[i] = $('#' + array[i]);
				$(this).empty();  
				for(var i=0; i < array.length; i++)
					$(this).append(array[i]);      
			});    
		}
	})(jQuery);
			

	(function($) {

		$.fn.addCall = function(guid) {
			var newCallDiv = '<div id="gs-call-' + guid +
			'" class="gs-call"><div class="gs-call-header" ' + 
			'id="gs-call-header-' + guid + '">'+
			'<div class="gs-call-text">Call ' +
			guid + '</div></div><div id="call-' + guid + '-users"' +
			'></div>';

			newCallDiv += '<div class="gs-button-container" id="button-container-' + guid + '">';

			if(guid == myCall)
			{
				newCallDiv += getLeaveButton();
			}
			else
			{	
				newCallDiv += getJoinButton(guid); 
			}
			newCallDiv += '</div></div>';

			$(this).append(newCallDiv);
		}
	})(jQuery);


	$('#talk-button').live('click', function()
	{
		jQuery.getJSON('http://ec2-174-129-55-249.compute-1.amazonaws.com/guid',
			function(data)
			{	
				myCall = data.GUID;
				$('#voice-widget-body').addCall(myCall);
				Twilio.Device.connect({GUID:data.GUID, name:thisUser});
				chatrooms.push(myCall);
			});
	});

	$('#leave-button').live('click', function()
	{
		Twilio.Device.disconnectAll();
		$('#button-container-' + myCall).empty();
		$('#button-container-' + myCall).append(getJoinButton(myCall));
		$('#call-' + myCall + '-users').removeUser(thisUser);
		$('#voice-widget-users').addUser(thisUser);
	});

	Twilio.Device.disconnect(function (conn)
	{
		
	});

	Twilio.Device.connect(function (conn) {
			connection = conn;
//		$('#talk-button').slideUp();
			$('#voice-widget-users').removeUser(thisUser);
			$('#call-' + myCall + '-users').addUser(thisUser);
	});

	
});
//end document ready

	(function($) {

		$.fn.addUser = function(userName) {

			var array = new Array();

			$(this).children().each(function()
			{
				array.push($(this).attr('id'));
			});
			var newUserDiv = '<div class="user-name" id="un-' +
				userName + '"><div class="user-name-text">' + userName +
				'</div></div>';
			if(array.length == 0)
			{
				$(this).append(newUserDiv);
			}
			else
			{
				var lastDiv = $('#' + array[array.length - 1]);
				$(newUserDiv).insertAfter(lastDiv);
				$('#voice-widget-users').reOrder();
			}
			userList.push(userName);
		}
	})(jQuery);
			
	(function($) {

		$.fn.removeUser = function(userName) {
			var array = new Array();

			$(this).children().each(function()
			{
				if($(this).attr('id') == 'un-' + userName)
				{
					$(this).remove();
				}
			});
		}
	})(jQuery);
			
	
/**
 * GameSpy Voice Communications!
 */
var GameSpy = {};
GameSpy.Voice = function() {}
GameSpy.Voice.prototype.addUser = function(name)
{
  $('#voice-widget-users').addUser(name);
	userList.push(name);
}

GameSpy.Voice.prototype.setThisUser = function(name)
{
	this.addUser(name);
	thisUser = name;
}
	
GameSpy.Voice.prototype.removeUser = function(name)
{
	//doesn't work if user is in a call...
  $('#voice-widget-users').removeUser(name);
	userList.remove(name);
	var i = userList.indexOf(name);
	if( i != -1)
	{
		userList.splice(i, 1);
	}
}	

