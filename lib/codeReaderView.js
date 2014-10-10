var fs = require('fs');
var Q = require('q');
var _ = require('underscore');
var cleancode = require('../lib/parserCleanCode.js');
var parserhtml = require('../lib/parserHTML.js');

module.exports = {
	parseCode: function(file){
		var viewtag = {};
		viewtag.viewcode = [];
		viewtag.classes = [];
		viewtag.ids = [];
		viewtag.attributes = [];
		var all = [];
		var promise = null;
		var errordata = {};

		/*  loop through each file to identify
		 all tags and the tags attributes  */

		_.each(file, function(htmlstring) {
			var filename = htmlstring.name;
			var code_formatted = cleancode.addPadding(htmlstring.content);
            var code = cleancode.cleanHTML(code_formatted);
            promise = parserhtml.start(filename, code, viewtag)
                .then(function(viewtag){
                    return viewtag;
                })
                .fail(function(err) {
                    return err;
                });

            all.push(promise);
		});

		if(all.length > 0){
			return Q.allResolved(all)
				.then(function(promises) {
					return Q(_.map(promises, Q.nearer));
				});
		}else{
			errordata.message = 'Can not resolve reading your view code.';
			errordata.status = 'error';
			return Q.reject({error:errordata});
		}
	}
};
