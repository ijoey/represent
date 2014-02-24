var Path = require('path');
var Url = require('url');
var Mime = require('mime');
var Http = require('http');
var Fs = require('graceful-fs');
var port = process.env.PORT;
var config = {};
var Moment = require('moment');
var rootPath = __dirname;
var resourcesFolder = rootPath + "/resources";
var Represent = require('./lib/represent');
var Resource = require('./lib/represent').Resource;
var Domain = require('domain');
if(!process.env.THEME) process.env.THEME = "default";
process.argv.forEach(function(value, fileName, args){
	if(/port:/.test(value)) process.env.PORT = /port:(\d+)/.exec(value)[1];
});
var web = (function(){
	var listeners = {
		request: function(request, response){
			// iterate over hooks synchronously so that each hook can finish the response if they so choose.
			var i = 0, ubounds = api.hooks.length;
			function processNextHook(hook){
				if(!hook){
					if(!response.headersSent) response.end(404, "Not found");
					return;
				}
				if(hook.handles(request)){
					//TODO: add exception handling here.
					hook.execute(request, response, function(err){
						if(err) console.log(err);
						processNextHook(api.hooks[i++]);
					});
				} else {
					processNextHook(api.hooks[i++]);
				}
			}
			processNextHook(api.hooks[i]);
		}
		, connection: function(socket){
			console.log('socket connection happened');
		}
		, close: function(){
			console.log('close happened', arguments);
		}
		, connect: function(request, socket, head){
			
		}
		, upgrade: function(request, socket, head){
			
		}
		, clientError: function(exception, socket){
			
		}
		, listening: function(){
			
		}
	};
	var routeHandlers = [];
	var api = {
		listeners: listeners
		, port: 5000
		, server: null
		, filter: function(req, res){
			var d = Domain.create();
			var self = this;
			d.on('error', function(err){
				console.error('error', err.stack);
				try{
					var killtimer = setTimeout(function(){
						process.exit(1);
					}, 30000);
					killtimer.unref();
					self.server.close();
					res.statusCode = 500;
					res.setHeader('content-type', 'text/plain');
					res.end('oops, application crashed.\n');
				}catch(err2){
					console.error('Error sending the 500 response after an error already occurred.', err2.stack);
				}
			});
			d.add(req);
			d.add(res);
		}
		, hooks: []
	};
	return api;
})();
Represent.themeRoot = rootPath + '/themes/' + process.env.THEME;
Represent.contenTypesFolder = rootPath + '/lib/contentTypes';

// Serve up requested files from public.
web.hooks.push({
	handles: function(request){
		return /\/public\//.test(request.url);
	}
	, execute: function staticServer(request, response, next){
		var path = rootPath + '/themes/' + process.env.THEME + request.url.replace('/public', '');
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
if(process.env.PORT) web.port = process.env.PORT;
web.server = Http.createServer(web.filter);
['request', 'connection', 'close', 'checkContinue', 'connect', 'upgrade', 'clientError'].forEach(function(event){
	if(web.listeners[event]) web.server.on(event, web.listeners[event]);
});

// Load available content type handlers.
Fs.readdirSync(Represent.contenTypesFolder).forEach(function(file) {
	var contentType = require(Represent.contenTypesFolder + "/" + file);
	Represent.contentTypes[contentType.key] = contentType;
});

// Load resources.
Fs.readdirSync(resourcesFolder).forEach(function(file) {
	require(resourcesFolder + "/" + file)(Represent.endpoints);
});
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