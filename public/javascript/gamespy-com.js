var keys = {};
var widgetShown = false;
var widgetTimeout = false;
var firstTime = true;
//var host = "";
var host = "http://ec2-174-129-55-149.compute-1.amazonaws.com";
function loadCSSFile(filename)
{
	var fileref=document.createElement("link");
	fileref.setAttribute("rel", "stylesheet");
	fileref.setAttribute("type", "text/css");
	fileref.setAttribute("href", filename);
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

	//logic to show/hide the widget when pressing Ctrl+V
	$(document).keydown(function(){
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

					//HACK
					if(firstTime)
					{
						//remove these when you get the server reporting
						$('#voice-widget-users').addUser('Sean');
						$('#voice-widget-users').addUser('AzHP');
						$('#voice-widget-users').addUser('BlueBerryP13');
						firstTime = false;
					}
				}
				widgetTimeout = true;
			}
		}
	});

	$(document).keyup(function(){
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
			
	var userList = new Array();
	var thisUser = 'Sean';

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
			
	var numCalls = 0;
	
	(function($) {

		$.fn.addCall = function(userName) {
			var newCallDiv = '<div id="gs-call-' + numCalls +
			'" class="gs-call"><div class="gs-call-header" ' + 
			'id="gs-call-header-' + numCalls + '">'+
			'<div class="gs-call-text">Call ' +
			numCalls + '</div></div><div id="call-' + numCalls + '-users"' +
			'></div>' +
			'<div id="leave-button-container" class="gs-button-container">' +
			'<div id="leave-button" class="gs-button">Leave</div></div>' +
			'</div>';

			$(this).append(newCallDiv);
			$('#call-' + numCalls + '-users').addUser(userName);
		}
	})(jQuery);

	var hackName = 'Sean';

	$('#talk-button').live('click', function()
	{
			$('#talk-button').slideUp();
			$('#voice-widget-users').removeUser(hackName);
			numCalls++;
			$('#voice-widget-body').addCall(hackName);
	});
});
