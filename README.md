<h1>represent: Make your Node app Representational</h1>
<h2>I want you to make RESTful applications</h2>
<p>But what does that mean? What makes a RESTful application? Well, for starters, you have to define what resources you want to expose. Then, how to represent them. This module aims to help you with the Representational part.</p>
<h2>Principles that this Codebase Intends to Follow</h2>
<ul>
	<li><a href="http://en.wikipedia.org/wiki/Separation_of_concerns" title="Separation of Concerns">Separation of Concerns</a></li>
	<li>Encapsulate what varies</li>
	<li><a href="http://en.wikipedia.org/wiki/Single_responsibility_principle" title="Single responsibility">Single Responsibility</a></li>
</ul>
<h2>Key Ideas that this Codebase Intends to Implement</h2>
<ul>
	<li><a href="http://en.wikipedia.org/wiki/Content_negotiation" title="Content Negotiation">Content Negotation</a></li>
	<li>The Representational part of <a href="http://en.wikipedia.org/wiki/Representational_state_transfer" title="REST">REST</a></li>
</ul>
<h1>Code Structure</h1>
<p>First of all, the core module is Represent and located in represent.js.</p>
<p>node app.js (or npm start - requires nodemon) starts the server and in there is where the Represent module is being used.</p>
<p><strong>Represent.themeRoot</strong> is set to the path where it can find it's templates. The term theme here comes from Wordpress' themes facility where you can define a theme for a site with it's CSS, JS, and templates. A template is an HTML, XML, JSON, etc. file. Technically, whatever Content Type exists in the contenTypes folder.</p>
<p>
	<strong>Represent.contenTypesFolder</strong> is set to the path where the content type modules are located.
</p>
<p>
	<strong>Represent.endpoints</strong> represent a list of modules that implement "handles" and "execute" and that will respond to a URI request. In this codebase, all of the endpoints are located in the resources folder (think of things as resources). But don't focus on that. Focus on the part where <strong>Represent.execute</strong> is called because that's the important part.
</p>
<p>When <strong>Represent.execute</strong> is finally called (in the app.js file), it implements Content Negotiation by checking for a file extension specified in the URI path (e.g. index.html, index.json, index.xml). If there's no file extension specified, then it checks the accepts header. If the code can't determine the requested content type, then it responds with Not Accepted. If it can, then the code searches it's contentTypes object (set by controlling code) for every module that indicates it wants to handle the requested content type. The code builds the template path by calling <strong>resource.getTemplateFor</strong> and sends it as one of the parameters to <strong>contentType.execute</strong>. The content type module reads the file, renders it via <a href="http://embeddedjs.com" title="EJS">EJS</a> and calls the callback function with the output, which is then sent to <strong>response.end</strong></p>

<h1>Ok. So now what can I do with this thing?</h1>
<p>Let's say you have a index.html file in your themes/default/templates/login/ folder and a login resource that responds to GET and POST. You can navigate to your site via /login and see the login page displayed (index.html). And, presuming you add code to the login resource to accept a usernanme and password, submit the form to login. That's great! But now you want that login capability from everywhere on the site. Normally, you'd probably create more code that would include creating a login form either in javascript, or in a header part of the site and then update your endpoint code to check whether or not it was requested via AJAX and to do something different if so. But with this codebase, you don't have to do all that. You can use the existing endpoint to make an AJAX request to /login.phtml and set the innerHTML of a DOM element to the response. You can hijack the login form submit to make an AJAX POST request to the same endpoint and react accordingly to the response. Added behavior without having to modify the original endpoint.</p>
<p>I really have to create some examples to get my point across, so I'll be doing that in the next months.</p>