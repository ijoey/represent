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

module.exports = (function json(){
	return {
		key: "application/json"
		, execute: function(exists, filePath, represent, result, callback){
			var output = null;
			if(!exists){
				callback(JSON.stringify(result.model));
			}else{
				readFromFile(filePath, result, function(output){
					result.output = output;
					var layout = represent.layoutRoot + result.resource.layout + ".json";
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
})();