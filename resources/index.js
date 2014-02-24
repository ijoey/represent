var Resource = require('../lib/resource');
module.exports = function Index(endpoints){
	var self = new Resource();
	self.title = "Representational Web Site";
	endpoints.get.push({handles: function(request){ return /^\/(index)?(\..*)?$/.test(request.url);}
		, execute: function(request, response, callback){
			callback({
				resource: self
				, model: {id: "index", name: "Testing", description: "Just testing code."}
			});
		}
	});
	self.getTemplateFor = function getTemplateFor(request){
		return "index/index";
	};
	return self;
};