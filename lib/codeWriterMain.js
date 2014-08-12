var fs = require('fs');
var Q = require('q');
var _ = require('underscore');
var fswriter = require('../lib/fsWriter');

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

module.exports = function(dirpath, fileformat, selectors, callback) {
    fswriter.services['rewriteFile'](dirpath,selectors)
        .then(function(files){

        })
        .fail(function(err) {
            return callback(err, null);
        });
};

