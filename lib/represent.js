var Path = require('path');
var Fs = require('fs');
var Mime = require('mime');
var Url = require('url');
var Mimeparse = require('./mimeparse');
var contentTypes = {};

var Represent = module.exports = {
	appPath: './'
	, contentTypesFolder: this.appPath + '/contentTypes'
	, contentTypes: {}
	, themeRoot: this.appPath + '/themes/default/'
	, templatesRoot: this.themeRoot + '/templates/'
	, layoutRoot: this.templatesRoot + 'layouts/'
	, defaultExt: '.html'
	, endpoints: {
		get: []
		, post: []
		, delete: []
		, options: []
		, head: []
		, trace: []
	}
	, fromTheAcceptHeader: function(method, headers){
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
	, lookupMediaTypeViaExt: function(ext){
		return Mime.lookup(ext);
	}
	, extensionViaContentNegotation: function(request){
		var urlExt = this.fromUrl(request.url);
		if(urlExt.length > 1) return urlExt;
		var ext = this.fromTheAcceptHeader(request.method, request.headers);
		return ext;
	}
	, fromUrl: function(url){
		var parsed = Url.parse(url, true, true);
		return Path.extname(parsed.pathname);
	}
	, execute: function(result, callback){
		var output = null;
		var ext = this.extensionViaContentNegotation(result.request);
		if(ext === null) ext = this.defaultExt;
		ext = ext === ".phtml" ? ".html" : ext;
		var filePath = this.templatesRoot + result.template + ext;
		for(var prop in result.resource.header) result.response.setHeader(prop, result.resource.header[prop]);
		var contentTypeKey = this.lookupMediaTypeViaExt(ext);
		var contentType = this.contentTypes[contentTypeKey];
		if(!result.resource.header["Content-Type"]) result.response.setHeader("Content-Type", contentTypeKey);
		if(!contentType){
			return callback(406);
		}
		Fs.exists(filePath, function(exists){
			contentType.execute(exists, filePath, Represent, result, function(output){
				callback(output);
			});
		});
	}
};