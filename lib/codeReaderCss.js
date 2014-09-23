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
					.then(function(attributes) {

						var ids = attributes[0];
						var classes = attributes[1];
						var tags = attributes[2];
						var advancedcss = attributes[3];
						var attributeselectors = attributes[4];
						var fname = attributes[5];

						allids = self.getSelectors(ids,allids,fname);
						allclasses = self.getSelectors(classes,allclasses,fname);
						alltags = self.getSelectors(tags,alltags,fname);
						allcomplex = self.getSelectors(advancedcss,allcomplex,fname);
						allattributes = self.getSelectors(attributeselectors,allattributes,fname);

						selectors.ids = allids;
						selectors.classes = allclasses;
						selectors.tags = alltags;
						selectors.complexselectors = allcomplex;
						selectors.attributes = allattributes;

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
		var clean = cleancode.cleanCSS(code);
		var attributes = [];
		var viewtag;
		var css;
		if(clean.slice(0,1) === '"')
			css = clean.slice(1).match(/[^}]+(?=\{)/g);
		else
			css = clean.match(/[^}]+(?=\{)/g);

		viewtag = parser.start(filename, css);
		attributes.push(viewtag.ids);
		attributes.push(viewtag.classes);
		attributes.push(viewtag.tags);
		attributes.push(viewtag.complexarray);
		attributes.push(viewtag.attributesarray);
		attributes.push(filename);

		return Q(attributes);
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
