var Resource = require(__dirname.replace('examples/web/resources', '') + 'lib/resource');
module.exports = function Index(endpoints){
	var self = new Resource();
	self.title = "Representational Web Site";
	endpoints.get.push({handles: function(request){ return /^\/(index)?(\..*)?$/.test(request.url);}
		, execute: function(request, response, callback){
			callback({
				resource: self
				, model: [
					{
						h1: "represent: Make your Node app Representational"
						, h2: "I want you to make RESTful applications"
						, p: 'But what does that mean? What makes a RESTful application? Well, for starters, you have to define what resources you want to expose. Then, how to represent them. This module aims to help you with the Representational part.'
					}
					, {
						h2: 'Principles that this Codebase Intends to Follow'
						, ul: [{a: {href: "http://en.wikipedia.org/wiki/Separation_of_concerns"
									, title: "Separation of Concerns"}}]
					}
				]
			});
		}
	});
	self.getTemplateFor = function getTemplateFor(request){
		return "index/index";
	};
	return self;
};