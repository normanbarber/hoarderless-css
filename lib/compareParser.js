var _ = require('underscore');
var compare = require('../lib/compare.js');
var findselectors = require('../lib/compareFindSelectorTypes.js');
module.exports = {

	/*  comparing object created from html file read
		with object created from css file read  */

	cssParser: function(viewdom,selector,tagselector){

		/*  reading the css selector
		 identifying all classes and ids chained together
		 finally compares the css selector with each in the html object
		 if its not found in the html it returns false  */

		var tagdata = {};
		var attributes;
		var tag;
		var tagelement = {};
		var allattributes;
		var classarray=[];
		var idsarray=[];
		var tags_array = selector.split('\t');
		var current_tab_indents = tags_array.length;
		var tagname;

		selector = selector.replace(/\(.*?\)/g,"").replace(/:nth-child/g,"").replace(/:first-child/g,"").replace(/:last-child/g,"").replace(/:not/g,"").replace(/\[.*?\]/g,"");
		if(selector.slice(0,1) == '#' || selector.slice(0,1) == '.'){
			attributes = selector.split('#');
		}
		else{
			attributes = selector.match(/[^(#)]+/g);
			tagname = tags_array[current_tab_indents - 1].match(/[^\A]+(?=\.)|[^\A]+(?=\#)|[^\A]+(?=\()|([^\s]+)/g);
			if(tagname[0].match(/\#/g))
				tagname = tagname[0].match(/[^\A]+(?=\#)/g);

			if(tagname[0].match(/\./g))
				tagname = tagname[0].match(/[^\A]+(?=\.)/g);

		}

		for(var i in attributes){
			var classes = attributes[i].split('.');

			if(i==0){
				// if a class is first
				if(classes.length > 1){
					for(var c=1; c<=classes.length; c++){
						if(classes[c]){

							classarray.push(classes[c]);
						}
					}
				}
			}
			else if(i >= 1){

				var attribute_ids = classes[0].match(/id="(.*?)"/gm);
				var attribute_classes = classes[0].match(/class="(.*?)"/gm);

				if(classes.length > 1){
					// handles classes(.) and loops through them if chained together
					for(var c=1; c<=classes.length; c++){
						if(classes[c]){

							classarray.push(classes[c]);
						}
					}


				}else if(classes[0] && attribute_ids){
					// handle attributes in parens
					var idreplace = attribute_ids[0].replace(/id="|"/g,"");
					var idreplacearray = idreplace.split(' ');

					for(var i=0; i<idreplacearray.length; i++){
						if(idreplacearray[i]){

							idsarray.push(idreplacearray[i]);
						}
					}

				}if(classes[0] && attribute_classes){
					// handle jade classes in parens loops thru all if more than one and saves to an array
					var classreplace = attribute_classes[0].replace(/class="|"/g,"");
					var classreplacearray = [];

					classreplacearray = classreplace.split(' ');
					for(var i=0; i<classreplacearray.length; i++){
						if(classreplacearray[i]){
							classarray.push(classreplacearray[i]);
						}
					}
					attribute_classes.push(classes[0]);
				}
				if(classes[0] && !attribute_ids){
					idsarray.push(classes[0]);
				}
			}

		}

		allattributes = this.formatAttributes(classarray,idsarray);
		data_attributes = null;
		viewdom = JSON.parse(viewdom);

		// if we have tag plus classes, ids, nthchild, lastchild, negation etc do the if
		// else if its just a tag
		if(allattributes || allattributes && selector.slice(0,1) === '.' || allattributes && selector.slice(0,1) === '#' || allattributes && selector.slice(0,1) === '['){
			if(selector.slice(0,1) != '.' && selector.slice(0,1) != '#' && selector.slice(0,1) != '['){
				tag = this.identifyTagName(selector);
				var tagfound = this.findViewTagMatch(tag, viewdom);
				if(!tagfound)
					return false;
			}

			tagelement = this.getViewElement(viewdom,allattributes,tag);
			tag = tagelement.tag;
			if(!tagelement)
				return false;

		}
		else{
			tagelement.tabindents = '';
			tag = this.identifyTagName(selector);
			var tagfound = this.findViewTagMatch(tag, viewdom);

			if(!tagfound)
				return false;

		}
		tagdata.selectors = allattributes;

		if(tagselector)
			tagdata.tag = tag + tagselector;
		else
			tagdata.tag = tag;

		tagdata.tabindents = tagelement.tabindents;
		return tagdata;
	},
	formatAttributes: function(classarray,idsarray){
		var classstr = '';
		var idstr = '';
		var idattributes;
		var classattributes;
		var allattributes;

		for(var c in classarray){
			classstr = classstr + ' ' + classarray[c];
		}

		for(var i in idsarray){
			idstr = idstr + ' ' + idsarray[i];
		}

		if(idstr)
			idattributes = 'id="' + idstr + '"';
		else
			idattributes = null;


		if(classstr)
			classattributes = 'class="' + classstr + '"';
		else
			classattributes = null;

		allattributes =    (classattributes ? classattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + (classattributes && idattributes ? ' ' : '')
			+ (idattributes ? idattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + (classattributes || idattributes ? ' ' : '');

		return allattributes;
	},
	identifyTagName: function(selector){
		var tagname;
		if(selector.match(/\w(.*?)\./g) && selector.match(/\w(.*?)\#/g)){
			tagname = selector.split('.');
			tagname = tagname[0].split('#');
			return tagname[0];
		}
		else if(selector.match(/\w(.*?)\./g)){
			tagname = selector.split('.');
			return tagname[0];
		}
		else if(selector.match(/\w(.*?)\#/g)){
			tagname = selector.split('#');
			return tagname[0];
		}
		else
			return selector;
	},
	findViewTagMatch: function(tag,viewdom){
		for(var i in viewdom){
			var file = viewdom[i].dom;
			for(var j in file){
				if(tag === file[j].tag){
					return file[j];
				}
			}
		}
		return false;
	},
	getViewElement: function(viewdom,attribute,tagname){
		var classes_array=[];
		var ids_array=[];
		var tag;
		var allmatched;

		if(attribute.match(/class="(.*?)"/gm)){
			var attribute_classes = findselectors.findClasses(attribute);
			classes_array = attribute_classes.split(' ');
		}
		if(attribute.match(/id="(.*?)"/gm)){
			var attribute_ids = findselectors.findIds(attribute);
			ids_array = attribute_ids.split(' ');
		}
		selectorslength = classes_array.length + ids_array.length;

		for(var i in viewdom){
			var file = viewdom[i].dom;
			for(var j in file){
				var viewclasses;
				var viewids;
				var viewcodeattributes = file[j].attributes.toString();

				if(viewcodeattributes.match(/id="(.*?)"/gm)){
					viewids = findselectors.findIds(viewcodeattributes);
					viewids = viewids.split(' ');
				}
				if(viewcodeattributes.match(/class="(.*?)"/gm)){
					viewclasses = findselectors.findClasses(viewcodeattributes);
					viewclasses = viewclasses.split(' ');
				}

				allmatched = 0;
				if(ids_array.length >= 1){
					for(var m in ids_array){
						for(var n in viewids){
							if(viewids[n] == ids_array[m]){
								allmatched++;
								if(allmatched == selectorslength){
									if(tagname && file[j].tag == tagname){
										tag = file[j];
										return tag;
									}else if(!tagname){
										tag = file[j];
										return tag;
									}
								}
							}
						}
					}
				}
				if(classes_array.length >= 1){
					for(var m in classes_array){
						for(var n in viewclasses){
							if(viewclasses[n] == classes_array[m]){
								allmatched++;
								if(allmatched == selectorslength){
									if(tagname && file[j].tag == tagname){
										tag = file[j];
										return tag;
									}else if(!tagname){
										tag = file[j];
										return tag;
									}

								}
							}
						}
					}
				}
			}
		}
		return false;
	}
}

