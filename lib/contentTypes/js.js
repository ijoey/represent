var Path = require('path');
var Fs = require('fs');
var Ejs = require('ejs');
function readFromFile(filePath, result, callback){
	Fs.readFile(filePath, {encoding: "utf-8"}
		, function(err, data){
			if(err) throw err;
			var output = Ejs.render(data, result);
			output = output.split(/\n/);
			output.forEach(function(s){ s = s.replace(/^\t+/, '');});
			output = output.join('');
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