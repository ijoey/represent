var Path = require('path');
var Fs = require('fs');
var Mime = require('mime');
var Url = require('url');
var Mimeparse = require('./mimeparse');
var contentTypes = {};
module.exports = (function(){
	var self = {};
	var appPath = './';
	Object.defineProperty(self, 'appPath', {
		get: function(){ return appPath;}
		, set: function(v){
			appPath = v;
		}
		, enumerable: true
	});
	var contetTypesFolder = appPath + '/contentTypes';
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
	var themeRoot = appPath + "/themes/default/";
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
		else key = 'Content-Type';
		var ext = null;
		if(headers[key]){
			var bestMatch = Mimeparse.bestMatch(['text/html', 'application/json', 'application/xml', '*/*'], headers[key]);
			ext = Mime.extension(bestMatch);
		}
		if(ext !== null && ext !== undefined) return '.' + ext;
		return null;
	}
	self.endpoints = {
		get:[]
		, post:[]
		, delete:[]
		, options:[]
		, head:[]
		, trace:[]
	};
	self.lookupMediaTypeViaExt = function(ext){
		return Mime.lookup(ext);
	};
	self.extensionViaContentNegotation = function(request){
		var urlExt = self.fromUrl(request.url);
		if(urlExt.length > 1) return urlExt;
		var ext = fromTheAcceptHeader(request.method, request.headers);
		return ext;
	};
	self.fromUrl = function(url){
		var parsed = Url.parse(url, true, true);
		return Path.extname(parsed.pathname);
	};
	self.execute = function(result, callback){
		var output = null;
		var ext = this.extensionViaContentNegotation(result.request);
		if(ext === null) ext = this.defaultExt;
		ext = ext === ".phtml" ? ".html" : ext;
		var filePath = this.templatesRoot + result.template + ext;
		for(var prop in result.resource.header) result.response.setHeader(prop, result.resource.header[prop]);
		var contentTypeKey = self.lookupMediaTypeViaExt(ext);
		var contentType = contentTypes[contentTypeKey];
		if(!result.resource.header["Content-Type"]) result.response.setHeader("Content-Type", contentTypeKey);
		if(!contentType){
			return callback(406);
		}
		Fs.exists(filePath, function(exists){
			contentType.execute(exists, filePath, self, result, function(output){
				callback(output);
			});
		});
	};
	return self;
})();