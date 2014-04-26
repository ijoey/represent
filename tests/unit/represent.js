var Assert = require('assert');
var root = __dirname.replace('/tests/unit', '');
var Web = require(root + '/server');
var InMemoryStream = require(root + '/tests/stream');
var Fs = require('fs');
var Represent = require(root + '/index').Represent;
Represent.contenTypesFolder = root + '/lib/contentTypes';
Represent.templatesRoot = root + '/tests/default/';
Represent.layoutRoot = root + '/tests/default/';
Fs.readdirSync(Represent.contenTypesFolder).forEach(function(file) {
    var contentType = require(Represent.contenTypesFolder + "/" + file);
    Represent.contentTypes[contentType.key] = contentType;
});
Web.hooks.push(require(root + '/lib/hook'));
var PostsResource = {
    handles: function(request){
        return /^\/posts(.*)/.test(request.url);
    }
    , execute: function(request, response, callback){
        callback({resource: this, model: {"id":1, "title":"Test post", "content":"This is the content for a test post", "published":new Date()}});
    }
    , getTemplateFor: function(request){
        return "posts";
    }
    , header: {}
    , layout: 'default'
};
describe('GIVEN that I am a user', function(){
    it('WHEN I include a file extension in the URL with query params, THEN the response content type should be correct for the file extension', shouldMatchUrlExtensionWithQueryParams);
    it('WHEN I request posts.json, THEN the response content type header is set to application/json', shouldReturnJsonContentType);
    it('WHEN I request posts.html, THEN I get the response content type header is set to text/html', shouldReturnHtmlContentType);
    it('WHEN I request posts.phtml, THEN I get the response content type header is set to text/html', shouldReturnPartialHtmlContentType);
    it('WHEN I request posts.xml, THEN I get the response content type header is set to applicatin/xml', shouldReturnXmlContentType);
    it('WHEN I request posts.atom, THEN I get the response content type header is set to applicatin/atom+xml', shouldBeAtomContentType);
    it('WHEN I request posts.rss, THEN I get the response content type header is set to applicatin/rss+xml', shouldBeRssContentType);
});
describe('As a user', function(){
    it('I want posts as HTML so that I can read them in a web browser', shouldBeInHtml);
});
describe('GIVEN that I am a browser', function(){
    it("WHEN I send a request for a resource that doesn't exist, THEN I get a 404 response", notFoundRequest);
    it("WHEN I send a request for a resource with an html file extension, THEN the response Content-Type is text/html", notFoundHtmlRequest);
    it("WHEN I send a request for a resource with an html file extension AND a query string, THEN the response Content-Type is still text/html", notFoundHtmlRequestWithQueryString);
    it("WHEN I request posts, THEN the response Content-Type is HTML AND I get a list of posts", requestPostsInHtml);
});
function mockResponse(){
    var response = new InMemoryStream();
    response.headersSent = false;
    response.headers = {};
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

function shouldBeInHtml(){
    var request = new InMemoryStream();
    request.url = "/posts";
    request.headers = {};
    var response = mockResponse();
    var output = '';
    response.on('data', function(buffer){
        output += buffer.toString();
    });
    response.on('end', function(){
        Assert.equal(this.statusCode, 200);
        Assert.equal(this.headers['Content-Type'], 'text/html', "should be HTML");
        Assert(/\<html\>/.test(output), "Should contain \<html\>");
    });
    Represent.endpoints.get.push(PostsResource);
    Web.request(request, response);
}
function shouldMatchUrlExtensionWithQueryParams(){
    var request = new InMemoryStream();
    request.url = "/posts.json?test=1";
    var response = mockResponse();
    Represent.endpoints.get.push(PostsResource);
    Web.request(request, response);
    Assert.equal(response.statusCode, 200);
    Assert.equal(response.headers['Content-Type'], 'application/json', "Should be JSON: " + response.headers['Content-Type']);
}
function shouldReturnJsonContentType(){
    var request = new InMemoryStream();
    request.url = "/posts.json";
    var response = mockResponse();
    Represent.endpoints.get.push(PostsResource);
    Web.request(request, response);
    Assert.equal(response.statusCode, 200);
    Assert(response.headers['Content-Type'] === 'application/json', "Should be JSON");
}
function shouldReturnHtmlContentType(){
    var request = new InMemoryStream();
    request.url = "/posts.html";
    var response = mockResponse();
    Represent.endpoints.get.push(PostsResource);
    Web.request(request, response);
    Assert.equal(response.statusCode, 200);
    Assert(response.headers['Content-Type'] === 'text/html', "Should be HTML");
}
function shouldReturnPartialHtmlContentType(){
    var request = new InMemoryStream();
    request.url = "/posts.phtml";
    var response = mockResponse();
    Represent.endpoints.get.push(PostsResource);
    Web.request(request, response);
    Assert.equal(response.statusCode, 200);
    Assert(response.headers['Content-Type'] === 'text/html', "Should be HTML");
}
function shouldReturnXmlContentType(){
    var request = new InMemoryStream();
    request.url = "/posts.xml";
    var response = mockResponse();
    Represent.endpoints.get.push(PostsResource);
    Web.request(request, response);
    Assert.equal(response.statusCode, 200);
    Assert(response.headers['Content-Type'] === 'application/xml', "Should be XML");
}
function shouldBeAtomContentType(){
    var request = new InMemoryStream();
    request.url = "/posts.atom";
    var response = mockResponse();
    Represent.endpoints.get.push(PostsResource);
    Web.request(request, response);
    Assert.equal(response.statusCode, 200);
    Assert(response.headers['Content-Type'] === 'application/atom+xml', "Should be ATOM+XML");
}
function shouldBeRssContentType(){
    var request = new InMemoryStream();
    request.url = "/posts.rss";
    var response = mockResponse();
    Represent.endpoints.get.push(PostsResource);
    Web.request(request, response);
    Assert.equal(response.statusCode, 200);
    Assert(response.headers['Content-Type'] === 'application/rss+xml', "Should be RSS+XML");
}

function requestPostsInHtml(){
    var request = new InMemoryStream();
    request.url = "/notfound.html";
    var response = mockResponse();
    Web.request(request, response);
    Assert(response.statusCode === 404);
}

function notFoundRequest(){    
    var request = new InMemoryStream();
    request.url = "/notfound.html";
    var response = mockResponse();
    Web.request(request, response);
    Assert(response.statusCode === 404);
    Assert.equal(response.headers['Content-Length'], 9);
}

function notFoundHtmlRequest(){
    var request = new InMemoryStream();
    request.url = "/notfound.html";
    var response = mockResponse();
    Web.request(request, response);
    Assert.equal(response.headers["Content-Type"], "text/html");
}

function notFoundHtmlRequestWithQueryString(){
    var request = new InMemoryStream();
    request.url = "/notfound.html?id=234&something=else";
    var response = mockResponse();
    Web.request(request, response);
    Assert.equal(response.headers["Content-Type"], "text/html");
}
