var fs = require('fs');
var Q = require('q');
var _ = require('underscore');
var tagattributes = require('../lib/tagAttributes.js');

module.exports = {

	start: function(filename,codearray){
		var viewtag = {};
		viewtag.code = {};
		viewtag.dom = {};
		var allclasses = [];
		var allids = [];
		var attributes_array = [];
		var classesindex = 0;
		var idsindex = 0;

		for(var k in codearray) {
			var oneline = codearray[k].split('\t');
			if(!oneline[oneline.length - 1]){
				codearray.splice(parseInt(k),1);
			}
		}

		for(var k in codearray) {

			var classarray=[];
			var idsarray=[];
			var data_attributes_array = [];
			var data_attributes;
			var data_attributes_tmp = [];
			var attribute_classes;
			var attribute_ids;

			codearray[k] = codearray[k].replace(/\s*=\s*/g,"=");
			if(codearray[k].match(/ng-style/g)){
				codearray[k] = codearray[k].replace(/style="(.*?)",|style="(.*?)"|ng\s*:\s*style="(.*?)",|ng\s*:\s*style="(.*?)"|ng-style="(.*?)",|ng-style="(.*?)"/g,"");
			}

			// handle everyting in tags parens if there are any
			if(codearray[k].match(/\(.*?\)/g)){
				data_attributes = codearray[k].match(/\(.*?\)/g);
				var attribute_spaces = data_attributes[0].replace(/<~>/g," ").replace(/\./g,"");
				data_attributes = attribute_spaces.replace(/\(|\)/g,"");
				attribute_classes = data_attributes.match(/class="(.*?)"/gm);
				if(attribute_classes){
					attribute_classes = attribute_classes[0].replace(/class="|"/g,"");

					var attribute_classes_array = attribute_classes.split(' ');
					for(var i in attribute_classes_array){
						classesindex = allclasses.length;
						allclasses[classesindex] = {"filename" : filename, "selector" : attribute_classes_array[i]};
						classarray.push(attribute_classes_array[i]);
					}
				}
				attribute_ids = data_attributes.match(/id="(.*?)"/gm);
				if(attribute_ids){
					attribute_ids = attribute_ids[0].replace(/id="|"/g,"");

					var attribute_ids_array = attribute_ids.split(' ');
					for(var i in attribute_ids_array){
						idsindex = allids.length;
						allids[idsindex] = {"filename" : filename, "selector" : attribute_ids_array[i]};
						idsarray.push(attribute_ids_array[i]);
					}
				}
				data_attributes = data_attributes.replace(/class="(.*?)"/g,"").replace(/id="(.*?)"/g,"").replace(/,/g,"").replace(/\s*:\s*/g,":").replace(/\s\s+/g," ");
				data_attributes_tmp = data_attributes.split(',');

				for(var i in data_attributes_tmp){

					if(data_attributes_tmp[i])
						data_attributes_array.push(data_attributes_tmp[i]);
				}
				codearray[k] = codearray[k].replace(/\(.*?\)/g,"");
			}else{
				data_attributes='';
			}

			var attributes = codearray[k].match(/[^(#)*?]+(?=)/g);
			var tags_array = codearray[k].split('\t');  // the codearray gets split so every tab gets replaced with an empty index. the last index in tags_array with be the line of code. so i use the length - 1 to determine how many tabs in each line of code
			var current_tab_indents = tags_array.length;
			var tagname = tags_array[current_tab_indents - 1].match(/[^\A]+(?=\.)|[^\A]+(?=\#)|[^\A]+(?=\()|([^\s]+)/g);

			if(tagname[0].match(/\#/g))
				tagname = tagname[0].match(/[^\A]+(?=\#)/g);

			if(tagname[0].match(/\./g))
				tagname = tagname[0].match(/[^\A]+(?=\.)/g);

			for(var i in attributes){
				var classes = attributes[i].split('.');

				if(i==0){
					// if a class is first push to class array
					if(classes.length > 1){
						tagname[0] = classes[0].replace(/\s*|"/g,"");
						for(var c=1; c<=classes.length; c++){
							if(classes[c]){
								classesindex = allclasses.length;
								allclasses[classesindex] = {"filename" : filename, "selector" : classes[c]};
								classarray.push(classes[c]);
							}
						}
					}
				}
				else if(i >= 1){

					var attribute_ids = classes[0].match(/id="(.*?)"/gm);
					var attribute_classes = classes[0].match(/class="(.*?)"/gm);

					if(classes.length > 1){
						// handles jade classes  or (.) and loops through them if chained together
						for(var c=1; c<=classes.length; c++){
							if(classes[c]){
								classesindex = allclasses.length;

								allclasses[classesindex] = {"filename" : filename, "selector" : classes[c]};
								classarray.push(classes[c]);
							}
						}
					}else if(classes[0] && attribute_ids){
						// handle attributes in parens
						var idreplace = attribute_ids[0].replace(/id="|"/g,"");
						var idreplacearray = idreplace.split(' ');
						tagname[0] = tagname[0];
						for(var i=0; i<idreplacearray.length; i++){
							if(idreplacearray[i]){
								idsindex = allids.length;
								allids[idsindex] = {"filename" : filename, "selector" : idreplacearray[i]};
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
								classesindex = allclasses.length;
								allclasses[classesindex] = {"filename" : filename, "selector" : classreplacearray[i]};
								classarray.push(classreplacearray[i]);
							}

						}
						attribute_classes.push(classes[0]);
					}
					if(classes[0] && !attribute_ids){
						idsindex = allids.length;
						allids[idsindex] = {"filename" : filename, "selector" : classes[0]};
						idsarray.push(classes[0]);
					}
				}
			}

			var allattributes = tagattributes.getTagAttributes(classarray,idsarray,data_attributes_array);

			data_attributes = null;
			if(allattributes)
				attributes_array.push(allattributes);

			var tagname = tagattributes.getTagName(tagname[0]);
			var children_array = tagattributes.getTagChildren(codearray,k,current_tab_indents);
			var siblings_array = tagattributes.getTagSiblings(codearray,k,current_tab_indents);
			viewtag.dom[k]= {};
			viewtag.dom[k].tag = tagname;
			viewtag.dom[k].attributes = allattributes;
			viewtag.dom[k].children = children_array;
			viewtag.dom[k].siblings = siblings_array;
			viewtag.dom[k].tabindents = current_tab_indents;

		}
		viewtag.classes = allclasses;
		viewtag.ids = allids;
		viewtag.attributes = attributes_array;
		viewtag.code.dom = viewtag.dom;

		return viewtag;
	}
}
