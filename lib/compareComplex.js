var _ = require('underscore');
var compare = require('../lib/compare.js');
var findselectors = require('../lib/compareFindSelectorTypes.js');
module.exports = {
	matchViewTagByAttributes: function(viewattribute,attribute){
		/*  identify operator if used and do work
			at the bottom to see if its used or unused */
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
	identifyOperator: function(viewcode, operator, tag1, tag2){

		var tagname1 = tag1.tag;
		var tagname2 = tag2.tag;
		var operatorfound;

		if(operator && operator.match(/>/g))
			operatorfound = this.compare_DirectChildren(viewcode,operator, tag2, tag1, tagname2);
		else if(operator && operator.match(/~/g))
			operatorfound = this.compare_Siblings(viewcode,operator, tag2, tag1, tagname2);
		else if(operator && operator.match(/\+/g))
			operatorfound = this.compare_Adjacent(viewcode, tagname1, tagname2);

		return operatorfound;

	},
	compare_DirectChildren: function(viewcode, operator, tag2, tag1, tagname2){
		// tag ->  direct children  (  >  )
		var matchfound;
		for(var i in viewcode){
			for(var j in viewcode[i].dom){
				if(!tag2.selectors && viewcode[i].dom[j].tag === tagname2){

					if(viewcode[i].dom[j].tabindents - tag1.tabindents === 1){
						return true;
					}
				}else{
					matchfound = this.matchViewTagByAttributes(viewcode[i].dom[j].attributes,tag2.selectors);
					if(matchfound && (viewcode[i].dom[j].tabindents - tag1.tabindents === 1)){
						return true;
					}
				}
			}
		}
		return false;
	},
	compare_Siblings: function(viewcode, operator, tag2, tag1, tagname2){
		// tag -> sibling ( ~ )
		var matchfound;
		var tagname1 = tag1.tag;
		for(var i in viewcode){
			for(var j in viewcode[i].dom){
				if(!tag2.selectors && viewcode[i].dom[j].tag === tagname1){
					if(tag1.selectors){
						matchfound = this.matchViewTagByAttributes(viewcode[i].dom[j].attributes,tag1.selectors);

						var tagsiblings = viewcode[i].dom[j].siblings;
						for(var k in tagsiblings){
							if(matchfound && tagsiblings[k] === tagname2){
								return true;
							}

						}
					}else if(!tag1.selectors){
						var tagsiblings = viewcode[i].dom[j].siblings;
						for(var k in tagsiblings){
							if(tagsiblings[k] === tagname2){
								return true;
							}

						}
					}
				}else if(tag2.selectors && viewcode[i].dom[j].tag === tagname1){
					var tagsiblings = viewcode[i].dom[j].siblings;
					for(var k in tagsiblings){
						if(tagsiblings[k] === tag2.tag){

							for(var m in viewcode[i].dom){
								if(viewcode[i].dom[m].tag === tagname2){
									matchfound = this.matchViewTagByAttributes(viewcode[i].dom[m].attributes,tag2.selectors);
									if(matchfound && parseInt(m) != parseInt(j))
										return true;
								}
							}
						}
					}
				}
			}
		}
		return false;
	},
	compare_nthChild: function(viewcode, selector, tagname, n){
		// tag ->  :nth-child  :first-child :last-child
		var siblingscount = 1;

		for(var i in viewcode){
			for(var j in viewcode[i].dom){
				if(!selector.selectors && viewcode[i].dom[j].tag === tagname){
					if(n === 1)
						return true;

					var tagsiblings = viewcode[i].dom[j].siblings;
					for(var k in tagsiblings){
						if(tagsiblings[k] === tagname){
							siblingscount++;
							if(siblingscount > parseInt(n))
								return true
						}
					}
				}else if(selector.selectors && viewcode[i].dom[j].tag === tagname){
					matchfound = this.matchViewTagByAttributes(viewcode[i].dom[j].attributes,selector.selectors);
					if(matchfound){
						if(n === 1)
							return true;

						var tagsiblings = viewcode[i].dom[j].siblings;
						for(var k in tagsiblings){
							if(tagsiblings[k] === tagname){
								siblingscount++;
								if(siblingscount > parseInt(n))
									return true
							}
						}
					}
				}
			}
		}
		return false;
	},

	compare_attributes: function(viewcode, selector, attribute){
		attribute = attribute.toString().replace(/'|\[|\]/g,"");
		var is_complex_attribute = this.compare_complexAttributes(attribute);
		if(is_complex_attribute)
			return true;

		var attribute_array = attribute.split(',');
		var matchtag;
		var element;
		for(var i in viewcode){

			var file = viewcode[i].dom;
			for(var j in file) {
				matchtag = selector.match(file[j].tag);
				if(matchtag || !selector){
					element = file[j];
					var tagattributes = file[j].attributes;
					var tagattributes_array = tagattributes.split(' ');
					for(var k in tagattributes_array){
						for(var m in attribute_array){
							if(tagattributes_array[k] && attribute_array[m] === tagattributes_array[k]){
								return true;
							}
						}

					}

				}
			}
		}
		return false;
	},
	compare_complexAttributes: function(selector){
		if(selector.match(/\^\=|\*\=|\?\=/g))
			return true;
		else
			return false;

	},
	compare_Adjacent: function(viewcode, tagname1, tagname2){
		// tag ->  adjacent  (  +  )
		var tag = tagname2;
		for(var i in viewcode){
			for(var j in viewcode[i].dom){
				if(viewcode[i].dom[j].tag === tagname1){
					if(viewcode[i].dom[j].tabindents === viewcode[i].dom[0].tabindents){
						var tagsiblings = viewcode[i].dom[0].siblings;
						if(tagsiblings[0] === tag){
							return true;
						}
					}
				}
			}
		}
		return false;
	}
}

