var port = process.env.PORT;
var Represent = require('./lib/represent');
var Resource = require('./lib/resource');
var appPath = __dirname;
var Fs = require('fs');
var resourcesFolder = appPath + '/resources';
var Url = require('url');
var Path = require('path');
var Mime = require('mime');
if(!process.env.THEME) process.env.THEME = "default";
process.argv.forEach(function(value, fileName, args){
	if(/port:/.test(value)) process.env.PORT = /port:(\d+)/.exec(value)[1];
});

var web = require('./server.js');
if(process.env.PORT) web.port = process.env.PORT;
web.server.listen(web.port, web.listeners.listening);
process.on('uncaughtException', function(err){
    console.log('uncaughtException: ', err.stack);
	process.exit(1);
});
process.on('exit', function() {
	web.server.close(function(){
		console.log('server is stopping after an exit event ', arguments);
	});
	console.log('exited.');
});
process.on('SIGTERM', function(){
	web.server.close(function(){
		console.log('server is stopping after an exit event ', arguments);
	});
	console.log('SIGTERM.');
});
Represent.appPath = appPath;
Represent.themeRoot = appPath + '/themes/' + process.env.THEME;
Represent.contenTypesFolder = appPath + '/lib/contentTypes';
// Load available content type handlers.
Fs.readdirSync(Represent.contenTypesFolder).forEach(function(file) {
	var contentType = require(Represent.contenTypesFolder + "/" + file);
	Represent.contentTypes[contentType.key] = contentType;
});

// Load resources.
Fs.readdirSync(resourcesFolder).forEach(function(file) {
	require(resourcesFolder + "/" + file)(Represent.endpoints);
});
// Serve up requested files from public.
web.hooks.push({
	handles: function(request){
		return /\/public\//.test(request.url);
	}
	, execute: function staticServer(request, response, next){
		var path = appPath + '/themes/' + process.env.THEME + request.url.replace('/public', '');
		Fs.exists(path, function(exists){			
			if(!exists) return next();
			var parsed = Url.parse(request.url, true, true);
			var ext = Path.extname(parsed.pathname);
			var contentType = Mime.lookup(ext);
			response.writeHead(200, {'Content-Type':contentType});			
			Fs.createReadStream(path).pipe(response);
		});
	}
});

// Negotiate content.
web.hooks.push({
	handles: function(request){
		return true;
	}
	, execute: function negotiateContent(request, response, next){
		function finallyRespondWithOutput(output){
			try{
				response.setHeader('Content-Length', Buffer.byteLength(output));
				response.end(output);
			}catch(exception){
				response.statusCode = 500;
				if(!response.headersSent) response.setHeader('Content-Length', Buffer.byteLength(exception.message));
				response.end(exception.message);								
			}
		}
		function respondWithRepresentation(result){
			result.resource.user = request.user;
			Represent.execute({
				model: result.model
				, request: request
				, response: response
				, resource: result.resource
				, site: {
					title: "Default"
				}
				, template: result.resource.getTemplateFor(request)
			}, finallyRespondWithOutput);
		}
		var wasHandled = false;
		for(var key in Represent.endpoints){
			var endpoint = Represent.endpoints[key];
			var i = 0;
			var ubounds = endpoint.length;
			for(i; i < ubounds; i++){
				var point = endpoint[i];
				if(point.handles(request)){
					point.execute(request, response, respondWithRepresentation);
					wasHandled = true;
				}
			}
		}
		if(!wasHandled){
			response.writeHead(404, {'Content-Type':'text/plain'});
			response.end("Error 404: resource not found. Unhandled request.");
		}
	}
});