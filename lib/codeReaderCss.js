var fs = require('fs');
var Q = require('q');
var _ = require('underscore');
var parser = require('../lib/parserCss.js');

module.exports = {

	parseCode: function(file){
		var self = this;
		var allclasses = [],
			allids = [],
			alltags = [],
			alladvanced = [],
			allattributes = [];

		var selectors = {};
		var all = [];
		var promise = null;
		var errordata = {};

		_.each(file, function(htmlstring) {
			var filename;
			var fileformat;

			filename = htmlstring.name;
			fileformat = htmlstring.format;
			htmlstring = JSON.stringify(htmlstring.content);

			if(fileformat === '.css'){

				promise = self.identifyCssSelectors(htmlstring,filename)
					.then(function(attributes) {

						var ids = attributes[0];
						var classes = attributes[1];
						var tags = attributes[2];
						var advancedcss = attributes[3];
						var attributeselectors = attributes[4];
						var fname = attributes[5];

						allids = self.identifyIds(ids,allids,fname);
						allclasses = self.identifyClasses(classes,allclasses,fname);
						alltags = self.identifyTags(tags,alltags,fname);
						alladvanced = self.identifyComplexSelectors(advancedcss,alladvanced,fname);
						allattributes = self.identifyAttributeSelectors(attributeselectors,allattributes,fname);

						selectors.ids = allids;
						selectors.classes = allclasses;
						selectors.tags = alltags;
						selectors.complexselectors = alladvanced;
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
			errordata.message = 'Did not find html/css files in the folder searched';
			errordata.status = 'error';
			return Q.reject({error:errordata});
		}


	},
	identifyCssSelectors: function(code,filename){
		// removing all line breaks tabs and comments
		var cleancode = code.replace(/'/g,'"')
				.replace(/(\\r\\n\\t|\\n|\\r|\\t|\\)/gm,"")
				.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)|"/gm,"")
				.replace(/\s*>\s*/g," > ")
				.replace(/\s*~\s*/g," ~ ")
				.replace(/\s*\+\s*/g," + ")
				.replace(/\s*=\s*/g,"=")
				.replace(/\s*\]/g,"]")
				.replace(/\[\s*/g,"[");

		var css = cleancode.match(/[^}]+(?=\{)/g);
		var attributes = [];
		var viewtag = parser.start(filename, css);

		attributes.push(viewtag.ids);
		attributes.push(viewtag.classes);
		attributes.push(viewtag.tags);
		attributes.push(viewtag.complexarray);
		attributes.push(viewtag.attributesarray);
		attributes.push(filename);

		return Q(attributes);
	},
	identifyComplexSelectors: function(classes,all_complex_css,filename){
		var index;
		var classestmp = [];
		var complex_css_array = [];
		complex_css_array.push(classes);

		for(var j=0; j < complex_css_array.length; j++){

			if(classestmp.indexOf(complex_css_array[j]) != 0){
				index = all_complex_css.length;
				all_complex_css[index] = {"filename" : filename, "selector" : complex_css_array[j]};
				classestmp.push(complex_css_array[j]);
			}
		}
		return all_complex_css;
	},
	identifyAttributeSelectors: function(attributes,allattributes,filename){
		var index;
		var attributestmp = [];
		var attributesarray = [];
		attributesarray.push(attributes);

		for(var i in attributesarray){
			for(var j=0; j < attributesarray[i].length; j++){

				if(attributestmp.indexOf(attributesarray[j]) != 0 && attributesarray[j]){
					index = allattributes.length;
					allattributes[index] = {"filename" : filename, "selector" : attributesarray[j]};
					attributestmp.push(attributesarray[j]);
				}
			}
		}
		return allattributes;
	},
	identifyClasses: function(classes,allclasses,filename){
		var classesindex;
		var classestmp = [];
		var classarray = [];

		classarray.push(classes);
		for(var j=0; j < classarray.length; j++){
			if(classestmp.indexOf(classarray[j]) != 0 && classarray[j]){
				classesindex = allclasses.length;
				allclasses[classesindex] = {"filename" : filename, "selector" : classarray[j]};
				classestmp.push(classarray[j]);
			}
		}
		return allclasses;
	},
	identifyIds: function(ids,allids,filename){
		var idsindex;
		var idstmp = [];
		var idarray = [];

		idarray.push(ids);
		for(var j=0; j < idarray.length; j++){
			if(idstmp.indexOf(idarray[j]) != 0 && idarray[j]){
				idsindex = allids.length;
				allids[idsindex] = {"filename" : filename, "selector" : idarray[j]};
				idstmp.push(idarray[j]);
			}
		}
		return allids;
	},
	identifyTags: function(tags,alltags,filename){
		var tagsindex;
		var tagstmp = [];
		var tagsarray = [];

		tagsarray.push(tags);
		for(var j=0; j < tagsarray.length; j++){
			if(tagstmp.indexOf(tagsarray[j]) != 0 && tagsarray[j]){
				tagsindex = alltags.length;
				alltags[tagsindex] = {"filename" : filename, "selector" : tagsarray[j]};
				tagstmp.push(tagsarray[j]);
			}
		}
		return alltags;
	}
}
