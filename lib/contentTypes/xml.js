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
function toXml(obj){
	var xml = '';
	if(Array.isArray(obj)){
		xml += '<items>';
		for(var key in obj) xml += '<item>' + toXml(obj[key]) + '</item>';
		return xml + '</items>';
	}
	for(var prop in obj){
		if(obj[prop] === null) continue;
		if(typeof obj[prop] === 'function') continue;
		if(typeof obj[prop] === 'string'){
			xml += '<' + prop + '>' + encodeURIComponent(obj[prop]) + '</' + prop + '>\n';				
		}else{
			xml += '<' + prop + '>' + toXml(obj[prop]) + '</' + prop + '>\n';
		}
	}
	return xml;
}
module.exports = {
	key: "application/xml"
	, execute: function(exists, filePath, represent, result, callback){
		var output = null;
		if(!exists){
			if(typeof result.model === 'string') output = '<value>' + result.model + '</value>';
			if(output === null) output = toXml(result.model);
			output = '<?xml version="1.0" encoding="UTF-8"?>\n<root>' + output + '</root>';
			callback(output);
		}else{
			readFromFile(filePath, result, function(output){
				result.output = output;
				var layout = represent.layoutRoot + result.resource.layout + ".xml";
				Fs.exists(layout, function(exists){
					if(!exists) return callback(output);
					readFromFile(layout, result, function(output){
						callback(output);					
					});
				});
			});
		}
	}
};
