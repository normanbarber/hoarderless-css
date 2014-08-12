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
        var all = [], promise = null;
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
        attributes.push(viewtag.classarray);
        attributes.push(viewtag.attributesarray);
        attributes.push(filename);

		return Q(attributes);
	},
	identifySelectorProperties: function(cleanedcode,selector,class_array,attributes_array,allclasses,allids,alltags){
		var regex_complex_operators =  />|\+|~|\s*\:\s*first-child|\s*\:\s*nth-child|\s*\:\s*last-child|\s*\:\s*not/g;
        var regex_attribute_selectors =  /\[(.*?)(?=\])/g;
        var regex_pseudo_selectors =  /(.*?)(?=\:[a-z])/g;
		var complex_selectors = selector.match(regex_complex_operators);
        var attribute_selectors = selector.match(regex_attribute_selectors);
        var pseudo_selectors = selector.match(regex_pseudo_selectors);

        if(selector.slice(0,1) === '*')
            return;

		var nthchild = selector.match(/\s*\:\s*first-child|\s*\:\s*nth-child|\s*\:\s*last-child|\s*\:\s*not/g);
        if(nthchild)
            selector =  selector.replace(/\s*:\s*/g,":");

		selector =  selector.replace(/\s{2,}/g," ").replace(/^\s+|\s+$/g,'');
		if(complex_selectors)
			return class_array.push(selector);

        if(attribute_selectors){
            return attributes_array.push(selector);
        }

		var multiselector = selector.split(' ');
		var multiselectorarray = multiselector.filter(function(m){return m !== ''});  // this cleans up arrays that have empty string values like, 	[ ' ', 'dannyfairy' ] will return [ 'dannyfairy' ]

		cleanedcode = cleanedcode.replace(/^\s+|\s+$/g,'');
		var chainedclasses = cleanedcode.split('.');  // this line will split all complex class selectors - need this to find selectors like  .classone.classtwo
		var chainedids = cleanedcode.split('#');
		chainedclasses = chainedclasses.filter(function(m){return m !== ''});
		chainedids = chainedids.filter(function(m){return m !== ''});

		// this is checking for selectors that are chained together like .classone.classtwo or #idone#idtwo#idthree
		if(chainedclasses.length >= 2 || chainedids.length >= 2)
		   return class_array.push(selector);

		// this is checking for multiple child selectors like h1 h2 or ul li
		if(multiselectorarray.length >= 2)
		   return class_array.push(selector);

		if(cleanedcode.slice(0,1) === '.'){
			var classes = cleanedcode.replace(/\.|"|\s*/g,"");
			return allclasses.push(classes);
		}
		if(cleanedcode.slice(0,1) === '#'){
			var ids = cleanedcode.replace(/\#|"|\s*/g,"");
			return allids.push(ids);
		}
        if(pseudo_selectors && !nthchild){
            for(var i in pseudo_selectors){
                pseudo_selectors[i] = pseudo_selectors[i].replace(/\:/g,"");
                if(pseudo_selectors[i])
                    return alltags.push(pseudo_selectors[i]);
            }
        }
        if(selector.slice(0,1) != '.' && selector.slice(0,1) != '#' && selector){
            var tags = selector.replace(/"|\s*/g,"");

            return alltags.push(tags);
        }
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
