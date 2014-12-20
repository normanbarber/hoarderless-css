var _ = require('underscore');
var comparecomplex = require('../lib/compareComplex.js');

module.exports = {
	updateTreeStructure: function(code,tag,operator){
		var view_code_obj = [];
		var child_array_index=1;

		for(var i in code){

			view_code_obj[i] = {};
			view_code_obj[i].filename = code[i].filename;
			var viewcode = code[i].dom;
			var view_code_array = [];
			var childarray = [];
			var siblingsarray = [];
			var matchfound = false;
			for(var j in viewcode){

				if(viewcode[j].treenode < tag.treenode){
					matchfound = false;
				}
				var siblings_array_index=1;

				if(!matchfound){
					matchfound = tag.attributes  ? this.getTagWithAttributes(viewcode[j].attributes,tag.attributes) && tag.tag === viewcode[j].tag : tag.tag === viewcode[j].tag && viewcode[j].treenode >= tag.treenode;
				}else if(matchfound && viewcode[j].treenode >= tag.treenode){
					if((operator === '~' || operator === '+')){
						view_code_array.push(viewcode[j]);
						if(viewcode[j].treenode < tag.treenode){
							matchfound = false;
						}
					}else if(matchfound && viewcode[j].treenode > tag.treenode){
						view_code_array.push(viewcode[j]);
						if(matchfound && viewcode[j].treenode <= tag.treenode){
							matchfound = false;
						}
					}
				}
			}
			view_code_obj[i].dom = view_code_array;
		}
		for(var m in view_code_obj){
			if(view_code_obj[m].dom.length > 0){
				view_code_obj = JSON.stringify(view_code_obj);
				return view_code_obj;
			}
		}
		return false;

	},
	getTagWithAttributes: function(viewattribute,attribute){
		var findselectors = require('../lib/compareFindSelectorTypes.js');

		/*  checking html for tags/attributes that match */
		/*  returns true if tag exists and attributes match */

		var classes_array=[];
		var ids_array=[];
		var allmatched;
		var selectorslength;
		var viewclasses;
		var viewids;

		if(viewattribute.match(/id="(.*?)"/gm)){
			viewids = findselectors.findIds(viewattribute);
			viewids = viewids.split(' ');
		}
		if(viewattribute.match(/class="(.*?)"/gm)){
			viewclasses = findselectors.findClasses(viewattribute);
			viewclasses = viewclasses.split(' ');
		}

		if(attribute.match(/class="(.*?)"/gm)){
			var attribute_classes = findselectors.findClasses(attribute);
			classes_array = attribute_classes.split(' ');
		}
		if(attribute.match(/id="(.*?)"/gm)){
			var attribute_ids = findselectors.findIds(attribute);
			ids_array = attribute_ids.split(' ');
		}

		selectorslength = classes_array.length + ids_array.length;
		allmatched = 0;
		if(ids_array.length >= 1){
			for(var m in ids_array){
				for(var n in viewids){
					if(viewids[n] == ids_array[m]){
						allmatched++;
						if(allmatched == selectorslength){
							return true;
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
							return true;
						}
					}
				}
			}
		}
		return false;
	}
}

