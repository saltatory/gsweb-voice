var keys = {};
var widgetShown = false;
var widgetTimeout = false;
var firstTime = true;
var numCall = 0;

//stores guid of my current call
var myCall;

var userList = new Array();
var thisUser = 'Sean';
var connection;
var chatroomData;
var chatrooms = new Array();
var roomUserList = new Array();

var sortNames = function(a,b)
{
	if(a.name > b.name) 
		return 1;
	if(a.name == b.name)
		return 0;
	if(a.name < b.name)
		return -1;
}

var joinCall = function(guid)
{
	myCall = guid;
	makeCall(guid);
	$('#button-container-' + guid).empty();
	$('#button-container-' + guid).append(getLeaveButton());
}

var makeCall = function(guid)
{
	jQuery.getJSON('http://ec2-174-129-55-249.compute-1.amazonaws.com/token',
		function(data)
		{
			Twilio.Device.setup(data.token);
			//NEW CALL
			if(!guid)
			{
				jQuery.getJSON('http://ec2-174-129-55-249.compute-1.amazonaws.com/guid',
				function(data)
				{	
					myCall = data.GUID;
					Twilio.Device.connect({GUID:data.GUID, name:thisUser});
					chatrooms.push(myCall);
					$('#voice-widget-body').addCall(myCall);
				});
			}
			//JOINING EXISTING CALL
			else
			{
					myCall = guid;
					Twilio.Device.connect({GUID:guid, name:thisUser});
			}
		});
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


var addUserToCall = function(guid, name)
{
	$('#call-' + guid + '-users').addUser(name);
}

var removeUserFromCall = function(guid, name)
{
	$('#call-' + guid + '-users').removeUser(name);
}

var roomClosed = false;

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
					roomUserList[chatrooms[j]] = null;
					removeRoom(chatrooms[j]);
					roomClosed = true;
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
				roomUserList[chatrooms[j]] = null;
				removeRoom(chatrooms[j]);
				roomClosed = true;
				j++;
			}
			chatrooms = newGuids;
			
			var newUserList = new Array();
			var newRoomUserList = new Array();
			var usersNotInChats = new Array();
			chatroomData.forEach(function(room)
			{
				newRoomUserList[room.guid] = room.Participants;
			});


			chatrooms.forEach(function(room)
			{
				if(!newRoomUserList[room])
					return;
				//check if chatroom exists in old list
				//iff it doesn't exist, copy the old list over
				if(roomUserList[room] == null)
				{
					roomUserList[room] = newRoomUserList[room];
					//populate room with users
					roomUserList[room].forEach(function(user)
					{
						addUserToCall(room, user.name);
						newUserList.push(user.name);
					});
					return;
				}
				//compare the user lists and add/remove users as needed
				//but ALWAYS add to newUserList so we can compare it to userList
				i = 0;
				j = 0;

				roomUserList[room].sort(sortNames);
				newRoomUserList[room].sort(sortNames);

				var oldUsers = roomUserList[room];
				var newUsers = newRoomUserList[room];
				while (j < oldUsers.length && i < newUsers.length)
				{
					newUser = newUsers[i].name;
					oldUser = oldUsers[j].name;
					if(newUser == oldUser)
					{
						newUserList.push(newUser);
						i++;
						j++;
					}
					//oldUser no longer exists, remove it
					else if(newUser > oldUser)
					{
						//alert('2: new user ' + newUser + ' old user ' + oldUser);
						removeUserFromCall(room, oldUser);
						j++;
					}
					//newUser is new! Add it!
					else if(newUser < oldUser)
					{
						//alert('3: new user ' + newUser + ' old user ' + oldUser);
						newUserList.push(newUser);
						addUserToCall(room, newUser);
						i++;
					}
				}
				
				//make new rooms until we're done
				while(i < newUsers.length)
				{
						//alert('4: new user ' + newUsers[i].name);
					newUserList.push(newUsers[i].name);
					addUserToCall(room, newUsers[i].name); 
					i++;
				}
				//remove old rooms until we're done
				while(j < oldUsers.length)
				{
					//alert('5: old user ' + oldUsers[j].name);
					removeUserFromCall(room, oldUsers[j].name);
					j++;
				}
				roomUserList[room] = newRoomUserList[room];

			});//chatrooms.foreach(room)
			//regenerate list of users who aren't in chats
			//we have a list of users who ARE in chats, and we have to
			//get the list of users in the game who are NOT in chats
		
		if(newUserList.length == 0 && !roomClosed)
			return;

			var notChatting = new Array();
		//	alert(userList);
			userList.forEach(function(user)
			{
				//user is playing but is NOT chatting
				if(newUserList.indexOf(user) == -1)
				{
					notChatting.push(user);
				}
			});
			notChatting.sort();
			
			$('#voice-widget-users').empty();

			notChatting.forEach(function(user)
			{
				$('#voice-widget-users').addUser(user);
			});
			roomClosed = false;
		});//getJSON()
}//getChatters()

var removeRoom = function(guid)
{
	$('#gs-call-' + guid).remove();
	numCall--;
}

window.setInterval(getChatters, 1000);

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

	var toggleWidget = function()
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
			/*
			if(firstTime)
			{
				//remove these when you get the server reporting
				$('#voice-widget-users').addUser('Sean');
				//thisUser = 'Sean';
				firstTime = false;
			}
			*/
		}
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
				toggleWidget();
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
			numCall++;

			var newCallDiv = '<div id="gs-call-' + guid +
			'" class="gs-call"><div class="gs-call-header" ' + 
			'id="gs-call-header-' + guid + '">'+
			'<div class="gs-call-text">Call ' +
			numCall + '</div></div><div id="call-' + guid + '-users"' +
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
		makeCall();
	});

	$('#voice-widget-header').live('click', function()
	{
		toggleWidget();
	});

	$('#leave-button').live('click', function()
	{
		Twilio.Device.disconnectAll();
		$('#button-container-' + myCall).empty();
		$('#button-container-' + myCall).append(getJoinButton(myCall));
		removeUserFromCall(myCall, thisUser);
		$('#voice-widget-users').addUser(thisUser);
		$('#talk-button').slideDown();

	});

	Twilio.Device.disconnect(function (conn)
	{
		
	});

	Twilio.Device.connect(function (conn) {
			connection = conn;
			$('#talk-button').slideUp();
			$('#voice-widget-users').removeUser(thisUser);
			addUserToCall(myCall, thisUser);
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
			if(userName == thisUser)
			{
				$('#un-' + userName).addClass('gs-hover');
			}
		}
	})(jQuery);
			
	(function($) {

		$.fn.removeUser = function(userName) {
			var array = new Array();
			//alert('remove user: ' + userName);
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
	thisUser = name;
	this.addUser(name);
}
	
GameSpy.Voice.prototype.removeUser = function(name)
{
	//doesn't work if user is in a call...
  $('#voice-widget-users').removeUser(name);
	//userList.remove(name);
	var i = userList.indexOf(name);
	if( i != -1)
	{
		userList.splice(i, 1);
	}
}	

