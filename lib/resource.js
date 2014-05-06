module.exports = function Resource(){
	var self = {
		layout: 'default'
		, title: 'Default title'
		, js: []
		, css: []
		, header: {}
		, user: null
		, status: {code:200, description: 'Ok'}
	}
	return self;
};
