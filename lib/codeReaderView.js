var fs = require('fs');
var Q = require('q');
var _ = require('underscore');
var parser = require('../lib/parserView.js');
var handlealt = require('../lib/codeReaderViewJadeAlt.js');

module.exports = {
	parseCode: function(file){
		var self = this;
		var classes = [],
			ids = [],
			attributes = [],
			viewdata = [],
			selectors = {},
			codearray;
		var all = [];
		var promise = null;
		var errordata = {};

		_.each(file, function(htmlstring) {
			var filename;
			var fileformat;

			fileformat = htmlstring.format;
			var code_formatted = htmlstring.content + '\r\n\r\n';

			if(fileformat === '.jade'){
				var spaces_replaced = code_formatted.replace(/'/g,'"')
													.replace(/\s*=\s*/g,"=")
													.replace(/\s*"\s*/g,'"');

				codearray = spaces_replaced.match(/[^\r\n]+(?=\r)/g);
				promise = handlealt.removeIrrelevant(codearray)
					.then(function(codecleaned){
						filename = htmlstring.name;
						return self.init(filename, codecleaned);
					})
					.then(function(allselectors){
						classes.push(allselectors.classes);
						ids.push(allselectors.ids);
						attributes.push(allselectors.attributes);
						viewdata.push(allselectors.code);
						selectors.classes = classes;
						selectors.ids = ids;
						selectors.attributes = attributes;
						selectors.viewcode = viewdata;
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
	init: function(filename,codearray){

		var viewtag;
		codearray = handlealt.init(codearray);

		viewtag = parser.start(filename, codearray);
		viewtag.code.filename = filename;

		return Q(viewtag);
	}
};
