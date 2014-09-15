var fs = require('fs');
var Q = require('q');
var _ = require('underscore');
var cleancode = require('../lib/parserCleanCode.js');
var parserhtml = require('../lib/parserHTML.js');

module.exports = {
	parseCode: function(file){
		var self = this;
		var classes = [],
			ids = [],
			attributes = [],
			viewcode = [],
			selectors = {};
		var all = [];
		var promise = null;
		var errordata = {};

		/*  loop through each file to identify
			all tags and the tags attributes  */
		_.each(file, function(htmlstring) {
			var filename;
			var fileformat;

			fileformat = htmlstring.format;
			var code_formatted = cleancode.addPadding(htmlstring.content);

			if(fileformat === '.jade'){
				/* 	compile jade to html
					then call parsehtml.start() */
			}
			if(fileformat === '.html'){
				var code = cleancode.cleanHTML(code_formatted);
				filename = htmlstring.name;
				promise = self.initHTML(filename, code)
					.then(function(allselectors){
						allselectors.code.filename = filename;
						classes.push(allselectors.classes);
						ids.push(allselectors.ids);
						attributes.push(allselectors.attributes);
						viewcode.push(allselectors.code);
						selectors.classes = classes;
						selectors.ids = ids;
						selectors.attributes = attributes;
						selectors.viewcode = viewcode;
						return selectors;
					})
					.fail(function(err) {
						return err;
					});

					all.push(promise);
			}
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
	},
	initHTML: function(filename,code){
		var viewtag;
		viewtag = parserhtml.start(filename, code);
		return Q(viewtag);
	}
};
