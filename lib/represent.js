var Path = require('path');
var Fs = require('fs');
var Mime = require('mime');
var Url = require('url');
var Mimeparse = require('./mimeparse');
var contentTypes = {};
var rootPath = __dirname.replace('/lib', '');
module.exports = (function(){
	var self = {};
	var contetTypesFolder = rootPath + '/contentTypes';
	Object.defineProperty(self, 'contetTypesFolder', {
		get: function(){ return contetTypesFolder;}
		, set: function(v){
			contetTypesFolder = v;
		}
		, enumerable: true
	});
	var contentTypes = {};
	Object.defineProperty(self, 'contentTypes', {
		get: function(){ return contentTypes;}
		, set: function(v){
			contentTypes = v;
		}
		, enumerable: true
	});
	var themeRoot = rootPath + "/themes/default/";
	Object.defineProperty(self, 'themeRoot', {
		get: function(){ return themeRoot;}
		, set: function(v){
			themeRoot = v;
		}
		, enumerable: true
	});
	
	var templatesRoot = themeRoot + "templates/";
	Object.defineProperty(self, 'templatesRoot', {
		get: function(){ return templatesRoot;}
		, set: function(v){
			templatesRoot = v;
		}
		, enumerable: true
	});

	var layoutRoot = templatesRoot + "layouts/";
	Object.defineProperty(self, 'layoutRoot', {
		get: function(){ return layoutRoot;}
		, set: function(v){
			layoutRoot = v;
		}
		, enumerable: true
	});

	var defaultExt = ".html";
	Object.defineProperty(self, 'defaultExt', {
		get: function(){ return defaultExt;}
		, set: function(v){
			defaultExt = v;
		}
		, enumerable: true
	});
	
	function fromTheAcceptHeader(method, headers){
		var key = null;
		if(['GET','HEAD'].indexOf(method) > -1) key = 'accept';
		else key = 'content-type';
		var ext = null;
		if(headers[key]){
			var bestMatch = Mimeparse.bestMatch(['text/html', 'application/json', 'application/xml', '*/*'], headers[key]);
			ext = Mime.extension(bestMatch);
		}
		if(ext !== null && ext !== undefined) return '.' + ext;
		return null;
	}
	function fromUrl(url){
		var parsed = Url.parse(url, true, true);
		return Path.extname(parsed.pathname);
	}
	function extensionViaContentNegotation(request){
		var urlExt = fromUrl(request.url);
		if(urlExt.length > 1) return urlExt;
		var ext = fromTheAcceptHeader(request.method, request.headers);
		return ext;
	}
	self.endpoints = {
		get:[]
		, post:[]
		, delete:[]
		, options:[]
		, head:[]
		, trace:[]
	};
	self.execute = function(result, callback){
		var output = null;
		var ext = extensionViaContentNegotation(result.request);
		if(ext === null) ext = this.defaultExt;
		ext = ext === ".phtml" ? ".html" : ext;
		var filePath = this.templatesRoot + result.template + ext;
		for(var prop in result.resource.header) result.response.setHeader(prop, result.resource.header[prop]);
		var contentTypeKey = Mime.lookup(ext);
		var contentType = contentTypes[contentTypeKey];
		if(!result.resource.header["Content-Type"]) result.response.setHeader("Content-Type", contentTypeKey);
		if(!contentType){
			result.response.setHeader("Content-Type", "text/plain");
			result.response.statusCode = 406;
			return callback("Not accepted");
		}
		Fs.exists(filePath, function(exists){
			contentType.execute(exists, filePath, self, result, function(output){
				callback(output);
			});
		});
	};
	return self;
})();