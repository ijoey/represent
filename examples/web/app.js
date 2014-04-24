var libPath = __dirname.replace('examples/web', '');
var port = process.env.PORT;
var Represent = require(libPath + 'lib/represent');
var Resource = require(libPath + 'lib/resource');
var appPath = __dirname;
var Fs = require('fs');
var resourcesFolder = appPath + '/resources';
var Url = require('url');
var Path = require('path');
var Mime = require('mime');
var Http = require('http');
if(!process.env.THEME) process.env.THEME = "default";
process.argv.forEach(function(value, fileName, args){
	if(/port:/.test(value)) process.env.PORT = /port:(\d+)/.exec(value)[1];
});

var Web = require(libPath + '/server.js');
if(process.env.PORT) Web.port = process.env.PORT;
Web.server = Http.createServer(Web.filter);
['request', 'connection', 'close', 'checkContinue', 'connect', 'upgrade', 'clientError'].forEach(function(event){
	if(Web[event]) Web.server.on(event, Web[event]);
});

process.on('uncaughtException', function(err){
    console.log('uncaughtException: ', err.stack);
	process.exit(1);
});
process.on('exit', function() {
	Web.server.close(function(){
		console.log('server is stopping after an exit event ', arguments);
	});
	console.log('exited.');
});
process.on('SIGTERM', function(){
	Web.server.close(function(){
		console.log('server is stopping after an exit event ', arguments);
	});
	console.log('SIGTERM.');
});
Represent.appPath = appPath;
Represent.themeRoot = appPath + '/themes/' + process.env.THEME;
Represent.templatesRoot = Represent.themeRoot + '/templates/';
Represent.contenTypesFolder = libPath + 'lib/contentTypes';
Fs.readdirSync(Represent.contenTypesFolder).forEach(function(file) {
    var contentType = require(Represent.contenTypesFolder + "/" + file);
    Represent.contentTypes[contentType.key] = contentType;
});

// Load resources.
Fs.readdirSync(resourcesFolder).forEach(function(file) {
	require(resourcesFolder + "/" + file)(Represent.endpoints);
});
// Serve up requested files from public.
Web.hooks.push({
	handles: function(request){
		return /\/public\//.test(request.url);
	}
	, execute: function staticServer(request, response, next){
		var path = appPath + '/themes/' + process.env.THEME + request.url.replace('/public', '');
		Fs.exists(path, function(exists){			
			if(!exists) return next();
			var parsed = Url.parse(request.url, true, true);
			var ext = Path.extname(parsed.pathname);
			var contentType = Mime.lookup(ext);
			response.writeHead(200, {'Content-Type':contentType});			
			Fs.createReadStream(path).pipe(response);
		});
	}
});
Web.hooks.push(require(libPath + 'lib/hook'));
Web.server.listen(Web.port, Web.listening);
