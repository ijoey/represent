var Http = require('http');
var port = process.env.PORT;
var Domain = require('domain');
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
web.server = Http.createServer(web.filter);
['request', 'connection', 'close', 'checkContinue', 'connect', 'upgrade', 'clientError'].forEach(function(event){
	if(web.listeners[event]) web.server.on(event, web.listeners[event]);
});
module.exports = web;