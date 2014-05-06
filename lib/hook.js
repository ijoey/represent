var Represent = require(__dirname + '/represent');
module.exports = {
	handles: function(request){
		return true;
	}
	, execute: function execute(request, response, next){
		function finallyRespondWithOutput(output){
			if(output === undefined) console.log('output is undefined', request.url);
			try{
				var statusCode = parseInt(output);
				if(statusCode === 406){
					output = "Not Acceptable";
					response.statusCode = 406;
				}else if(statusCode === 404){
					output = "Not Found";
					response.statusCode = 404;
				}
				response.setHeader('Content-Length', Buffer.byteLength(output));
				response.end(output);
			}catch(exception){
				response.statusCode = 500;
				if(!response.headersSent) response.setHeader('Content-Length', Buffer.byteLength(exception.message));
				console.log('url = ', request.url);
				console.log(exception.stack);
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
		var method = request.method.toLowerCase();
		if(Represent.endpoints[method]){
			var i = 0;
			var ubounds = Represent.endpoints[method].length;
			for(i; i < ubounds; i++){
				var endpoint = Represent.endpoints[method][i];
				if(endpoint.handles(request)){
					endpoint[method](request, response, respondWithRepresentation);
					wasHandled = true;
				}
			}
		}
		if(!wasHandled){
			var output = "Not Found";
			response.setHeader('Content-Type', Represent.lookupMediaTypeViaExt(Represent.extensionViaContentNegotation(request)));
			response.setHeader('Content-Length', Buffer.byteLength(output));
			response.statusCode = 404;
			response.end(output);
		}
	}
};