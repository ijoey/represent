var Http = require('http');
var port = process.env.PORT;
var Domain = require('domain');
var hooks = [];
module.exports = {
	request: function(request, response){
		var i = 0, ubounds = hooks.length;
		function executeHook(hook){
			if(!hook) return;
			if(hook.handles(request)){
				hook.execute(request, response, function(err){
					if(err) console.log(err);
					executeHook(hooks[i++]);
				});
			} else {
				executeHook(hooks[i++]);
			}
		}
		executeHook(hooks[i]);
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
	, port: 5000
	, filter: function filter(request, response){
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
				response.statusCode = 500;
				response.setHeader('Content-Type', 'text/plain');
				response.end('oops, application crashed.\n');
			}catch(err2){
				console.error('Error sending the 500 response after an error already occurred.', err2.stack);
			}
		});
		d.add(request);
		d.add(response);
	}
	, hooks: hooks
};
/*
//Do this to setup the web server.
web.server = Http.createServer(web.filter);
['request', 'connection', 'close', 'checkContinue', 'connect', 'upgrade', 'clientError'].forEach(function(event){
	if(web[event]) web.server.on(event, web[event]);
});*/