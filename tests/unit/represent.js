var Assert = require('assert');
var root = __dirname.replace('/tests/unit', '');
var Web = require(root + '/server');
var InMemoryStream = require(root + '/tests/inmemorystream');
var Fs = require('fs');
var config = {};
var represent = require(root + '/index').Represent(config);
var Test = require('tap').test;
var Util = require('util');
represent.contenTypesFolder = root + '/lib/contentTypes';
represent.templatesRoot = root + '/tests/default/';
represent.layoutRoot = root + '/tests/default/';
represent.contentTypes = {};
Fs.readdirSync(represent.contenTypesFolder).forEach(function(file) {
    var contentType = require(represent.contenTypesFolder + "/" + file);
    represent.contentTypes[contentType.key] = contentType;
});
Web.hooks.push(require(root + '/lib/hook')(represent));

(function setupResourceEndpoints(endpoints){
  var self = {
    header: {}
    , layout: 'default'
    , getTemplateFor: function(request){
      return 'posts';
    }
  };

  endpoints.get.push({
      handles: function(request){
        return /^\/posts(.*)/.test(request.url);
      }
      , execute: function(request, response, callback){
        callback({resource: this, model: {"id":1, "title":"Test post", "content":"This is the content for a test post", "published":new Date()}});
      }
      , getTemplateFor: self.getTemplateFor
      , header: self.header
      , layout: self.layout
  });
  
  endpoints.post.push({
    handles: function(request){
      return /^\/posts(.*)/.test(request.url);
    }
    , execute: function(request, response, callback){
      response.statusCode = 201;
      callback({resource: this, model: {"id":1, "title":"Test post", "content":"This is the content for a test post", "published":new Date()}});
    }
    , getTemplateFor: self.getTemplateFor
    , header: self.header
    , layout: self.layout
  });
})(represent.endpoints);

Test('GIVEN that I am a user', function(t){
    shouldMatchUrlExtensionWithQueryParams(t, 'WHEN I include a file extension in the URL with query params, THEN the response content type should be correct for the file extension');
    shouldReturnJsonContentType(t, 'WHEN I request posts.json, THEN the response content type header is set to application/json');
    shouldReturnHtmlContentType(t, 'WHEN I request posts.html, THEN I get the response content type header is set to text/html');
    shouldReturnPartialHtmlContentType(t, 'WHEN I request posts.phtml, THEN I get the response content type header is set to text/html');
    shouldReturnXmlContentType(t, 'WHEN I request posts.xml, THEN I get the response content type header is set to applicatin/xml');
    shouldBeAtomContentType(t, 'WHEN I request posts.atom, THEN I get the response content type header is set to applicatin/atom+xml');
    shouldBeRssContentType(t, 'WHEN I request posts.rss, THEN I get the response content type header is set to applicatin/rss+xml');
	t.end();
});
Test('GIVEN that I am a browser', function(t){
    notFoundRequest(t, "WHEN I send a request for a resource that doesn't exist, THEN I get a 404 response");
    notFoundHtmlRequest(t, "WHEN I send a request for a resource with an html file extension, THEN the response Content-Type is text/html");
    notFoundHtmlRequestWithQueryString(t, "WHEN I send a request for a resource with an html file extension AND a query string, THEN the response Content-Type is still text/html");
    requestPostsInHtml(t, "WHEN I request posts, THEN the response Content-Type is HTML AND I get a list of posts");
    postRequest(t, "WHEN I send a POST request, THEN I get a 201 response");
	t.end();
});
Test('GIVEN that I am the server', function(t){
	fooBarCookie(t, "WHEN I set a cookie value foo=bar in the response, THEN the response cookie object has foo = bar");
	t.end();
});
Test('As a user', function(t){
    shouldBeInHtml(t, 'I want posts as HTML so that I can read them in a web browser');
	t.end();
});
function mockResponse(){
    var response = new InMemoryStream();
    response.headersSent = false;
    response.headers = {};
    response.cookies = {};
    response.setHeader = function setHeader(k, v){
        this.headers[k] = v;
    };
    response.statusCode = 200;
    response.writeHead = function writeHead(code, obj){
        this.statusCode = code;
        for(var key in obj){
            this.setHeader(key, obj[key]);
        }
    };
    return response;
}
function postRequest(t, when){
    var request = new InMemoryStream();
    request.url = "/posts.html";
    request.method = "post";
    var response = mockResponse();
    Web.request(request, response);
    Assert.equal(response.statusCode, 201, "status code should be 201");
    t.equal(response.headers['Content-Type'], 'text/html', when);
}
function fooBarCookie(t, when){
  var request = new InMemoryStream();
  request.url = "/posts";
  request.headers = {};
  request.method = "get";
  var response = mockResponse();
  var output = '';
  response.cookies['foo'] = 'bar';
  response.on('data', function(buffer){
      output += buffer.toString();
  });
  response.on('end', function(){
      t.equal(this.cookies['foo'], 'bar', when);
  });
  Web.request(request, response);
}
function shouldBeInHtml(t, when){
    var request = new InMemoryStream();
    request.url = "/posts";
    request.headers = {};
    request.method = "get";
    var response = mockResponse();
    var output = '';
    response.on('data', function(buffer){
        output += buffer.toString();
    });
    response.on('end', function(){
        Assert.equal(this.headers['Content-Type'], 'text/html');
		Util.log(when);
        t.ok(/\<html\>/.test(output), when);
    });
    Web.request(request, response);
}
function shouldMatchUrlExtensionWithQueryParams(t, when){
    var request = new InMemoryStream();
    request.url = "/posts.json?test=1";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.equal(response.headers['Content-Type'], 'application/json', when);
}
function shouldReturnJsonContentType(t, when){
    var request = new InMemoryStream();
    request.url = "/posts.json";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.equal(response.headers['Content-Type'], 'application/json', when);
}
function shouldReturnHtmlContentType(t, when){
    var request = new InMemoryStream();
    request.url = "/posts.html";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.ok(response.headers['Content-Type'] === 'text/html', when);
}
function shouldReturnPartialHtmlContentType(t, when){
    var request = new InMemoryStream();
    request.url = "/posts.phtml";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.ok(response.headers['Content-Type'] === 'text/html', when);
}
function shouldReturnXmlContentType(t, when){
    var request = new InMemoryStream();
    request.url = "/posts.xml";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.ok(response.headers['Content-Type'] === 'application/xml', when);
}
function shouldBeAtomContentType(t, when){
    var request = new InMemoryStream();
    request.url = "/posts.atom";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.ok(response.headers['Content-Type'] === 'application/atom+xml', when);
}
function shouldBeRssContentType(t, when){
    var request = new InMemoryStream();
    request.url = "/posts.rss";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.ok(response.headers['Content-Type'] === 'application/rss+xml', when);
}

function requestPostsInHtml(t, when){
    var request = new InMemoryStream();
    request.url = "/notfound.html";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.ok(response.statusCode === 404, when);
}

function notFoundRequest(t, when){
    var request = new InMemoryStream();
    request.url = "/notfound.html";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    Assert(response.statusCode === 404);
    t.equal(response.headers['Content-Length'], 9, when);
}

function notFoundHtmlRequest(t, when){
    var request = new InMemoryStream();
    request.url = "/notfound.html";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.equal(response.headers["Content-Type"], "text/html", when);
}

function notFoundHtmlRequestWithQueryString(t, when){
    var request = new InMemoryStream();
    request.url = "/notfound.html?id=234&something=else";
    request.method = "get";
    var response = mockResponse();
    Web.request(request, response);
    t.equal(response.headers["Content-Type"], "text/html", when);
}
