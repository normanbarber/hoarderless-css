
module.exports = {
	getTag: function(viewfiles,tag,operator){
		var view_code_obj = [];
		var child_array_index=1;

		for(var i in viewfiles){
			view_code_obj[i] = {};
			view_code_obj[i].filename = viewfiles[i].filename;
			var viewcode = viewfiles[i].dom;
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

		if(tagname.match(/\:nth-child/g)){
			var nthchild = tagname.match(/\((.*?)(?=\))/g);
			nthchild = nthchild.toString().slice(1);
			nthchild = nthchild.replace(/[^0-9]+/g, "");
			tagname = tagname.replace(/\(.*?\)/g,"").replace(/:nth-child/g,"");
			selector.tag = tagname;

			var nthchildfound = comparecomplex.compare_nthChild(viewcode, selector, tagname, nthchild);
			if(!nthchildfound)
				return false;
		}
		if(tagname.match(/\:first-child|\:last-child/g)){
			var nthchild = 1;
			tagname = tagname.replace(/:first-child/g,"").replace(/:last-child/g,"");
			selector.tag = tagname;

			var nthchildfound = comparecomplex.compare_nthChild(viewcode, selector, tagname, nthchild);
			if(!nthchildfound)
				return false;
		}
		if(tagname.match(/\:not/g)){
			var notvalue = tagname.match(/\((.*?)(?=\))/g);
			notvalue = notvalue.toString().slice(1);
			tagname = tagname.replace(/\(.*?\)/g,"").replace(/:not/g,"");
			selector.tag = tagname;

			var notvaluefound = comparecomplex.compare_negation(viewcode, selector.selectors, tagname, notvalue);
			if(!notvaluefound)
				return false;

		}
		if(tagname.match( /\[(.*?)(?=\])/g)){
			var attrvalue = tagname.match(/\[.*?\]/g);
			tagname = tagname.replace(/\[.*?\]/g,"");
			selector.tag = tagname;

			var attributefound = comparecomplex.compare_attributes(viewcode, tagname, attrvalue);
			if(!attributefound)
				return false;
		}

		return selector;
	},
	getTagSelector: function(selector){
		// returns the tag ( tr ) and the :nth-child() if it has one
		// returns the tag not the chained classes/ids

		var targetnthchild;
		var targetnotchild;
		var targetnumber;
		var tagselector = null;

		if(selector.match(/\s*\:\s*first-child|\s*\:\s*nth-child\s*|\s*\:\s*last-child|\:not|\[(.*?)(?=\])/g)){
			if(selector.match(/\s*\:\s*nth-child\s*/g)){
				targetnthchild = selector.match(/\s*\:\s*nth-child/g);
				targetnumber = selector.match(/\(.*?\)/g);
				tagselector = targetnthchild + targetnumber;
			}
			else if(selector.match(/\s*\:\s*first-child/g)){
				tagselector = selector.match(/\s*\:\s*first-child/g);
			}
			else if(selector.match(/\s*\:\s*last-child/g)){
				tagselector = selector.match(/\s*\:\s*last-child/g);
			}
			else if(selector.match(/\:not/g)){
				targetnotchild = selector.match(/\:not/g);
				targetnumber = selector.match(/\(.*?\)/g);
				tagselector = targetnotchild + targetnumber;
			}
			else if(selector.match(/\[(.*?)(?=\])/g)){
				targetnotchild = selector.match(/\[.*?\]/g);
				tagselector = targetnotchild;
			}

			return tagselector;

		}else
			return null
	}
}

