var http = require('http');
var fs = require('fs');
var queryString = require('querystring');
var rp = require('request-promise');

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
var OWM_API_KEY = '22cf961bcdba1c1e07075cd300013dd4';

var index = fs.readFileSync(__dirname + '/../client/index.html');
var jsFile = fs.readFileSync(__dirname + '/../client/main.js');
var cssFile = fs.readFileSync(__dirname + '/../client/styles.css');

function proxyReq(url, response, rss=false) {
	rp(url)
		.then(function(htmlString) {
			if(rss === true) {
				response.writeHead(200, responseHeadersRSS);
			} else {
				response.writeHead(200, responseHeaders);
			}
			response.write(htmlString);
			response.end();
		})
		.catch(function (err) {
			console.dir(err);
			response.writeHead(500, responseHeaders);
			
			var responseMessage = {
				message: "Error connecting to server. Check url and arguments for proper formatting"
			}
			
			response.write(JSON.stringify(responseMessage));
			response.end();
		});
}

function onRequest(request, response) {
	console.log(request.url);

	if(request.url === "/main.js") {
		response.writeHead(200, {"Content-Type": "text/javascript"});
		response.write(jsFile);
		response.end();
	} else if(request.url === "/styles.css") {
		response.writeHead(200, {"Content-Type": "text/css"});
		response.write(cssFile);
		response.end();
	} else if(request.url.split('?')[0] === "/proxy/weather") {
		var query = request.url.split('?')[1];
		var params = queryString.parse(query);
		
		if(!params.lon || !params.lat) {
			console.log("Missing params");
			response.writeHead(400, responseHeaders);
			var responseMessage = {
				message: "Missing url parameter in request"
			};
			response.write(JSON.stringify(responseMessage));
			response.end();
			return;
		}
		
		proxyReq("https://api.openweathermap.org/data/2.5/weather?lat=" + params.lat + "&lon=" + params.lon + "&appid=" + OWM_API_KEY + "&units=imperial", response);
		
	} else if(request.url === "/proxy/feed/bbc-world") {
		
		proxyReq("https://feeds.bbci.co.uk/news/world/rss.xml", response, true);
		
	} else if(request.url === "/proxy/feed/bbc-tech") {
		
		proxyReq("https://feeds.bbci.co.uk/news/technology/rss.xml", response, true);
		
	} else {
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(index);
		response.end();
	}
}

http.createServer(onRequest).listen(port);

console.log("Listening on 127.0.0.1:" + port);