var Q = require('q');
var fsreader = require('../lib/fsReader');

var codeReader = {
	returnData: function(data, html, filenames){
		var codedata = {
			'selectors' : data,
			'code' : html,
			'filenames': filenames,
			'status' : 'success'
		};
		return Q(codedata);
	}
}
module.exports = function(dirpath, fileformat, codereadermodule, callback) {

	/*  from the input start reading directory and
		read files inside parse each file
		one at a time then return */

	var parsedcode;
	fsreader.processDir(dirpath)
		.then(function(files){
			return fsreader.processFiles(files[0], dirpath, fileformat)
				.then(function(allcode){
					parsedcode = allcode;
					return codereadermodule.parseCode(allcode);
				})
				.then(function(code){
					return codeReader.returnData(code[0], parsedcode, files[0]);
				})
		})
		.then(function(code){
			return callback(null, code);
		})
		.fail(function(error) {
			return callback(error, null);
		});
};

