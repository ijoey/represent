var Path = require('path');
var Fs = require('fs');
var Ejs = require('ejs');
var trim = require('../trim');
function readFromFile(filePath, result, callback){
	Fs.readFile(filePath, {encoding: "utf-8"}
		, function(err, data){
			if(err) throw err;
			var output = Ejs.render(data, result);
			output = trim(output);
			callback(output);
		});
}
module.exports = {
	key: "text/html"
	, execute: function(exists, filePath, represent, result, callback){
		if(!exists){
			return callback(404);
		}
		readFromFile(filePath, result, function(output){
			if(result.request.url.indexOf('.phtml') > -1) return callback(output);
			result.output = output;
			var layout = represent.layoutRoot + result.resource.layout + ".html";
			Fs.exists(layout, function(exists){
				if(!exists) return callback(output);
				readFromFile(layout, result, function(output){
					callback(output);	
				});
			});
		});
	}
};

