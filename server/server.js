var http = require('http');
var fs = require('fs');
var queryString = require('querystring');
var requestHandler = require('request');

var port = process.env.PORT || process.env.NODE_PORT || 3000;
var responseHeaders = {	
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
	"access-control-allow-headers": "Content-Type, accept",
	"access-control-max-age": 10,
	"Content-Type": "application/json"
};
var responseHeadersRSS = {	
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
	"access-control-allow-headers": "Content-Type, accept",
	"access-control-max-age": 10,
	"Content-Type": "application/rss+xml"
};
var OWM_API_KEY '22cf961bcdba1c1e07075cd300013dd4';

var index = fs.readFileSync(__dirname + '/../client/index.html');
var jsFile = fs.readFileSync(__dirname + '/../client/.js');

function onRequest(request, response) {
	console.log(request.url);

	if(request.url === "/main.js") {
		response.writeHead(200, {"Content-Type": "text/javascript"});
		response.write(jsFile);
	} else if(request.url === "/proxy/weather") {
		var query = request.url.split('?')[1];
		var params = queryString.parse(query);
		
		if(!params.lon || !params.lat) {
			response.writeHead(400, responseHeaders);
			var responseMessage = {
				message: "Missing url parameter in request"
			};
			response.write(JSON.stringify(responseMessage));
			response.end();
			return;
		}
		
		try{
			response.writeHead(200, responseHeaders);
			requestHandler("https://api.openweathermap.org/data/2.5/weather?lat=" + params.lat + "&lon=" + params.lon + "&appid=" + OWM_API_KEY + "&units=imperial").pipe(response);
		}
		catch(exception) {
			console.dir(exception);
			response.writeHead(500, responseHeaders);
			
			var responseMessage = {
				message: "Error connecting to server. Check url and arguments for proper formatting"
			}
			
			response.write(JSON.stringify(responseMessage));
			response.end();
		}
	} else if(request.url === "/proxy/feed/bbc-world") {
		
		try{
			response.writeHead(200, responseHeaders);
			requestHandler("https://feeds.bbci.co.uk/news/world/rss.xml").pipe(response);
		}
		catch(exception) {
			console.dir(exception);
			response.writeHead(500, responseHeaders);
			
			var responseMessage = {
				message: "Error connecting to server. Check url and arguments for proper formatting"
			}
			
			response.write(JSON.stringify(responseMessage));
			response.end();
		}
	} else if(request.url === "/proxy/feed/bbc-tech") {
		
		try{
			response.writeHead(200, responseHeaders);
			requestHandler("https://feeds.bbci.co.uk/news/technology/rss.xml").pipe(response);
		}
		catch(exception) {
			console.dir(exception);
			response.writeHead(500, responseHeaders);
			
			var responseMessage = {
				message: "Error connecting to server. Check url and arguments for proper formatting"
			}
			
			response.write(JSON.stringify(responseMessage));
			response.end();
		}
	} else {
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(index);
	}
	
	response.end();
}

http.createServer(onRequest).listen(port);

console.log("Listening on 127.0.0.1:" + port);