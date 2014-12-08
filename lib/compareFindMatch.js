var comparecomplex = require('../lib/compareComplex.js');

module.exports = {
	getTag: function(code,tag,operator){
		var view_code_obj = [];
		var child_array_index=1;
        var siblings = require('../lib/selectors/siblings.js');

		for(var i in code){

			view_code_obj[i] = {};
			view_code_obj[i].filename = code[i].filename;
			var viewcode = code[i].dom;
			var view_code_array = [];
			var childarray = [];
			var siblingsarray = [];
			var matchfound = false;
			for(var j in viewcode){

				if(tag.selectors){
					if(viewcode[j].tabindents < tag.tabindents){
						matchfound = false;
					}
					var siblings_array_index=1;

					if(!matchfound){
						matchfound = this.getTagWithAttributes(viewcode[j].attributes,tag.selectors);
					}

					if(matchfound || childarray.indexOf(viewcode[j].tag) >= 0 || siblingsarray.indexOf(viewcode[j].tag) >= 0){
						var siblings = viewcode[j].siblings;
						for(var k in siblings){
							siblingsarray.push(siblings[k]);
						}

						var children = viewcode[j].children;
						for(var k in children){
							childarray.push(children[k]);
						}

						if(childarray.indexOf(viewcode[j].tag) >= 0 && child_array_index <= childarray.length){
							if(viewcode[j].tabindents > tag.tabindents){
								child_array_index++;
								var children = viewcode[j].children;
								for(var k in children){
									childarray.push(children[k]);
								}
							}
						}
						if(siblingsarray.indexOf(viewcode[j].tag) >= 0 && siblings_array_index <= siblingsarray.length && (operator === '~' || operator === '+')){
							if(viewcode[j].tabindents > tag.tabindents){
								siblings_array_index++;
								var siblings = viewcode[j].siblings;
								for(var k in siblings){
									siblingsarray.push(siblings[k]);
								}
							}
						}
						if(matchfound && viewcode[j].tabindents >= tag.tabindents){
							view_code_array.push(viewcode[j]);
						}
						else if(operator && operator.match(/\+|\~/)){
							view_code_array.push(viewcode[j]);
						}
					}
				}else if(!tag.selectors){
					if(tag.tag == viewcode[j].tag || (childarray.indexOf(viewcode[j].tag) >= 0 || siblingsarray.indexOf(viewcode[j].tag) >= 0)){
						view_code_array.push(viewcode[j]);
						var children = viewcode[j].children;
						for(var k in children){
							childarray.push(children[k]);
						}
						var siblings = viewcode[j].siblings;
						for(var k in siblings){
							siblingsarray.push(siblings[k]);
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
	},
	getTagWithPseudo: function(viewcode,operator,selector){
		var tagname = selector.tag;
		var comparecomplex = require('../lib/compareComplex.js');
		var code = comparecomplex.getArray(viewcode);
		if(tagname.match( /\[(.*?)(?=\])/g)){
			var attrvalue = tagname.match(/\[.*?\]/g);
			tagname = tagname.replace(/\[.*?\]/g,"");
			selector.tag = tagname;

			var attributefound = comparecomplex.compare_attributes(viewcode, tagname, attrvalue);
			if(!attributefound)
				return false;
		}

		return selector;
	}
}

