"use strict";

var app = {
	location: {
		data: {
			lastUpdate: 0,
			success: false,
			lat: undefined,
			lon: undefined
		},
		
		update: function() {
			navigator.geolocation.getCurrentPosition(function(pos) {
				app.location.data.lastUpdate = new Date();
				app.location.data.lat = pos.coords.latitude;
				app.location.data.lon = pos.coords.longitude;
				app.location.data.success = true;
				
				window.localStorage.location = JSON.stringify(app.location.data);
			});
		}
	},
	weather: {
		data: {
			lastUpdate: 0,
			current: {}
		},
		
		update: function() {
			if(app.location.data.success != true) {
				// don't have valid coords - don't try to use
				console.log("Not updating weather; no valid location");
				document.querySelector("#weather").innerHTML = '<i class="loadStates">Location unknown</i>';
				return;
			}
			if(new Date() - new Date(app.weather.data.lastUpdate) - (10*60*1000) < 0) {
				// don't refresh if <10min since last update - OWM will get sad if we do
				console.log("Not updating weather; last update too recent");
				return;
			}
			
			var xhr = new XMLHttpRequest();
			xhr.onload = function() {
				app.weather.data.current = JSON.parse(xhr.responseText);
				window.localStorage.weather = JSON.stringify(app.weather.data);
				app.weather.display();
			};
			var url = "/proxy/weather?lat=" + app.location.data.lat + "&lon=" + app.location.data.lon;
			xhr.open('GET',url,true);
			xhr.send();
		},
		display: function() {
			var tempNow = app.weather.data.current.main.temp;
			var tempHigh = app.weather.data.current.main.temp_max;
			var tempLow = app.weather.data.current.main.temp_min;
			document.querySelector("#weather").innerHTML = "<p>" + tempNow + "&deg;F (" + tempHigh + "/" + tempLow + ")";
		}
	},
	feedRSS: {
		data: {
			feeds: {
				"BBCWorld": {
					lastUpdate: 0,
					url: "/proxy/feed/bbc-world",
					cache: ""
				},
				"BBCTech": {
					lastUpdate: 0,
					url: "/proxy/feed/bbc-tech",
					cache: ""
				}
			},
			current: "BBCWorld"
		},
		
		update: function() {
			if(app.feedRSS.data.current == "") {
				// not currently displaying a feed, don't refresh
				return;
			}
			var feed = app.feedRSS.data.feeds[app.feedRSS.data.current];
			if(new Date() - new Date(feed.lastUpdate) - (15*60*1000) < 0) {
				// don't refresh if <15min since last update - feeds will be sad (BBC's specified TTL is 15)
				console.log("Not updating feed; last update too recent");
				app.feedRSS.display();
				return;
			}
			
			var xhr = new XMLHttpRequest();
			xhr.onload = function() {
				feed.lastUpdate = new Date();
				feed.cache = xhr.responseText;
				
				// Broken :(
				//if(window.localStorage.feeds == null) {
				//	window.localStorage.feeds = {};
				//}
				//window.localStorage.feeds[app.feedRSS.data.current] = JSON.stringify(feed);
				app.feedRSS.display();
			};
			xhr.onerror = function() {
				
			}
			xhr.open('GET',feed.url,true);
			xhr.send();
		},
		display: function() {
			if(app.feedRSS.data.current == "") {
				// not currently displaying a feed, don't refresh
				return;
			}
			var dom = new DOMParser().parseFromString(app.feedRSS.data.feeds[app.feedRSS.data.current].cache, "text/xml");
			if(dom.documentElement.nodeName == 'parseerror') {
				document.querySelector('#news').innerHTML('<p>Error loading feed :(</p>');
				return;
			}
			
			var div = document.createElement('div');
			var h1 = document.createElement('h1');
			var a = document.createElement('a');
			a.setAttribute('href', dom.querySelector('link').firstChild.nodeValue);
			a.textContent = dom.querySelector('title').firstChild.nodeValue;
			h1.appendChild(a);
			div.appendChild(h1);
			
			dom.querySelectorAll('item').forEach(function(node) {
				var item = document.createElement('div');
				
				var h2 = document.createElement('h2');
				var a = document.createElement('a');
				a.setAttribute('href', node.querySelector('link').firstChild.nodeValue);
				a.setAttribute('target', '_blank');
				var title = node.querySelector('title').firstChild.nodeValue;
				var date = prettyDate(new Date(node.querySelector('pubDate').firstChild.nodeValue));
				a.innerHTML = title + " <small><i>" + date + "</i></small>";
				h2.appendChild(a);
				item.appendChild(h2);
				
				var p = document.createElement('p');
				p.textContent = node.querySelector('description').firstChild.nodeValue;
				item.appendChild(p);
				
				div.appendChild(item);
			});
			
			var copyBlock = document.createElement('p')
			var copy = document.createElement('i');
			copy.textContent = dom.querySelector('copyright').firstChild.nodeValue;
			copyBlock.appendChild(copy);
			div.appendChild(copyBlock);
			
			document.querySelector('#news').innerHTML = "";
			document.querySelector('#news').appendChild(div);
		}
	},
	wikipediaNews: {
		data: {
			lastUpdate: 0,
			current: "",
		},
		
		update: function() {
			
		},
		display: function() {
			
		}
	},
	feed: {
		data: {
			currentModule: "feedRSS"
		},
		
		update: function() {
			app[app.feed.data.currentModule].update();
		},
		display: function() {
			app[app.feed.data.currentModule].display();
		}
	},
	
	focused: true,
	
	init: function() {
		if(window.localStorage.location != null) {
			app.location.data = JSON.parse(window.localStorage.location);
		}
		if(window.localStorage.weather != null) {
			app.weather.data = JSON.parse(window.localStorage.weather);
			app.weather.display();
		}
		// add feed cache persistence
		
		document.querySelector("#feedBBCWorld").onclick = function(e) {
			app.feed.current = "feedRSS";
			app.feedRSS.data.current = "BBCWorld";
			app.feed.update();
		};
		document.querySelector("#feedBBCTech").onclick = function(e) {
			app.feed.current = "feedRSS";
			app.feedRSS.data.current = "BBCTech";
			app.feed.update();
		};
		
		
		// set timer for update (15min?)
		app.update();
	},
	update: function() {
		app.location.update();
		app.weather.update();
		app.feed.update();
	}
};

function prettyDate(date) {
	var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	
	var dateString = days[date.getUTCDay()] + ", " + date.getUTCDay() + " " + months[date.getUTCMonth()] + " " + date.getUTCFullYear();
	var timeString = date.getUTCHours() + date.getUTCMinutes();
	
	return dateString + " " + timeString;
}

window.onload = (function() {
	app.init();
})();