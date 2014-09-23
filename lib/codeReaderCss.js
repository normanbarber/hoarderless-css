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
		var allclasses = [],
			allids = [],
			alltags = [],
			allcomplex = [],
			allattributes = [];

		var selectors = {};
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
						selectors.ids = self.getSelectors(viewtag.ids,allids,filename);;
						selectors.classes = self.getSelectors(viewtag.classes,allclasses,filename);;
						selectors.tags = self.getSelectors(viewtag.tags,alltags,filename);;
						selectors.complexselectors = self.getSelectors(viewtag.complexarray,allcomplex,filename);;
						selectors.attributes = self.getSelectors(viewtag.attributesarray,allattributes,filename);;
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
	getSelectors: function(ids,allselectors,filename){
		var selectorindex;
		var selectors = [];
		var selectorsarray = [];

		selectorsarray.push(ids);
		for(var j=0; j < selectorsarray.length; j++){
			if(selectors.indexOf(selectorsarray[j]) != 0 && selectorsarray[j]){
				selectorindex = allselectors.length;
				allselectors[selectorindex] = {"filename" : filename, "selector" : selectorsarray[j]};
				selectors.push(selectorsarray[j]);
			}
		}
		return allselectors;
	}
}
