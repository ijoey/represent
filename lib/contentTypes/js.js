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
	key: "application/javascript"
	, execute: function(exists, filePath, represent, result, callback){
		if(!exists){
			result.response.statusCode = 404;
			return callback("Not found.");
		}
		readFromFile(filePath, result, function(output){
			callback(output);					
		});
	}
};