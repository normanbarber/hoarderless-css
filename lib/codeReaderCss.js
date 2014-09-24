var fs = require('fs');
var Q = require('q');
var _ = require('underscore');
var parser = require('../lib/parserCss.js');
var cleancode = require('../lib/parserCleanCode.js');

module.exports = {

	/*  loop through css identifying
		selectors: classes, ids, tags, pseudo and complex */

	parseCode: function(file){
		var self = this;
		var selectors = {};
		selectors.ids = [];
		selectors.classes = [];
		selectors.tags = [];
		selectors.complexselectors = [];
		selectors.attributes = [];
		var all = [];
		var promise = null;
		var errordata = {};

		_.each(file, function(code) {
			var filename;
			var fileformat;

			filename = code.name;
			fileformat = code.format;
			code = JSON.stringify(code.content);

			if(fileformat === '.css' && filename.slice(0,13) != '_hoarderless_'){
				promise = self.identifyCssSelectors(code,filename)
					.then(function(viewtag) {
						for(var key in viewtag){
							selectors[key].push(self.getSelectors(viewtag[key],filename));
						}
						return selectors;
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
			errordata.message = 'Did not find css files in the folder searched';
			errordata.status = 'error';
			return Q.reject({error:errordata});
		}
	},
	identifyCssSelectors: function(code,filename){
		var cleancss = cleancode.cleanCSS(code);
		var viewtag;
		var css;

		if(cleancss.slice(0,1) === '"')
			css = cleancss.slice(1).match(/[^}]+(?=\{)/g);
		else
			css = cleancss.match(/[^}]+(?=\{)/g);

		viewtag = parser.start(filename, css);
		return Q(viewtag);
	},
	getSelectors: function(css,filename){
		var selectorsarray = [];

		for(var i=0; i < css.length; i++){
			if(selectorsarray.indexOf(css[i]) != 0 && css[i])
				selectorsarray.push(css[i]);

		}

		var selectors = {"filename" : filename, "selector" : selectorsarray};
		return selectors;
	}
}
