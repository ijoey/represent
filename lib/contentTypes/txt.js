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
	key: "text/plain"
	, execute: function(exists, filePath, represent, result, callback){
		if(!exists){
			result.response.statusCode = 404;
			return callback("Not found.");
		}
		readFromFile(filePath, result, function(output){
			result.output = output;
			var layout = represent.layoutRoot + result.resource.layout + ".txt";
			Fs.exists(layout, function(exists){
				if(!exists) return callback(output);
				readFromFile(layout, result, function(output){
					callback(output);					
				});
			});
		});
	}
};