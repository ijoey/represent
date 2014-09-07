module.exports = function(input){
	input = input.split(/\n/);
	for(var i = 0; i < input.length; i++){
		input[i] = input[i].replace(/^\t+/, '');
		input[i] = input[i].replace(/^\s+/, '');
		input[i] = input[i].replace(/\s+$/, '');
	}
	input = input.join('');
	return input;
};