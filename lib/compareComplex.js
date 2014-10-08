var Q = require('q');
var _ = require('underscore');
var getunusedcss = require('../lib/compareFindUnused.js');
var findmatch = require('../lib/compareFindMatch.js');
var compareparser = require('../lib/compareParser.js');
module.exports = {

	identifyOperator: function(viewcode, operator, tag1, tag2){

		var tagname1 = tag1.tag;
		var tagname2 = tag2.tag;
		var operatorfound;
		if(!operator)
			operatorfound = this.compare_DirectChildren(viewcode,operator, tag2, tag1, tagname2);
		else if(operator && operator.match(/>/g))
			operatorfound = this.compare_DirectChildren(viewcode,operator, tag2, tag1, tagname2);
		else if(operator && operator.match(/~/g))
			operatorfound = this.compare_Siblings(viewcode,operator, tag2, tag1, tagname2);
		else if(operator && operator.match(/\+/g))
			operatorfound = this.compare_Adjacent(viewcode, tagname1, tagname2);

		return operatorfound;
	},
	compare_DirectChildren: function(viewcode, operator, tag2, tag1, tagname2){

		// tag ->  direct children  (  >  )

		for(var i in viewcode){
			for(var j in viewcode[i].dom){
				if(!tag2.selectors && viewcode[i].dom[j].tag === tag1.tag){
					var tagchildren = viewcode[i].dom[j].children
					for(var k in tagchildren){
						if(tagchildren[k] === tagname2){
							return true;
						}
					}
				}else{
					var tagchildren = viewcode[i].dom[j].children
					for(var k in tagchildren){
						if(tagchildren[k] === tagname2){
							return true;
						}
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
						matchfound = findmatch.getTagWithAttributes(viewcode[i].dom[j].attributes,tag1.selectors);

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
									matchfound = findmatch.getTagWithAttributes(viewcode[i].dom[m].attributes,tag2.selectors);
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

		for(var i in viewcode){
			for(var j in viewcode[i].dom){
				var siblingscount = 1;
				if(!selector.selectors && viewcode[i].dom[j].tag === tagname){
					if(parseInt(n) === 1)
						return true;

					var tagsiblings = viewcode[i].dom[j].siblings;
					for(var k in tagsiblings){
						if(tagsiblings[k] === tagname){
							siblingscount++;
							if(siblingscount >= parseInt(n))
								return true
						}
					}
				}else if(selector.selectors && viewcode[i].dom[j].tag === tagname){
					matchfound = findmatch.getTagWithAttributes(viewcode[i].dom[j].attributes,selector.selectors);
					if(matchfound){
						if(parseInt(n) === 1)
							return true;

						var tagsiblings = viewcode[i].dom[j].siblings;
						for(var k in tagsiblings){
							if(tagsiblings[k] === tagname){
								siblingscount++;
								if(siblingscount >= parseInt(n))
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
	},
	compare_negation: function(viewcode, attributes, selectorname, notvalue){

		// tag ->  negation  (  :not()  )

		var matchtag;
		var element;
		var view = JSON.stringify(viewcode);
		var tagselector = findmatch.getTagSelector(selectorname);
		var tag = compareparser.cssParser(view,selectorname,tagselector);

		if(!tag)
			return false;

		var code = findmatch.getTag(viewcode,tag,null);
		code = JSON.parse(code);

		if(notvalue.slice(0,1) === ':'){
			var selector = {};
			selector.tag = tag.tag + notvalue;
			var pseudoselector = findmatch.getTagWithPseudo(code,null,selector);
			if(pseudoselector)
				return true;
			else
				return false;
		}
		else if(notvalue.slice(0,1) === '.' || notvalue.slice(0,1) === '#'){
			for(var i in viewcode){
				for(var j in viewcode[i].dom){
					var tagname = notvalue.split('#');
					var classarray = [];
					var idarray = [];
					idarray.push(tagname[1]);
					var attributes = compareparser.formatAttributes(classarray,idarray);
					matchfound = findmatch.getTagWithAttributes(viewcode[i].dom[j].attributes,attributes);
					if(matchfound)
						return true;
				}
			}
		}else{
			for(var i in code){
				var file = code[i].dom;
				for(var j in file) {
					matchtag = selectorname.match(file[j].tag);
					if(matchtag){
						element = file[j];

						var tag = notvalue.match(/[a-zA-Z-]+[\:]|[a-zA-Z-]+\.|[a-zA-Z-]+\#/);
						tag = tag[0].slice(0,-1);
						var tagchildren = file[j].children;
						for(var k in tagchildren){
							if(tagchildren[k] === tag){

								var selector = {};
								selector.tag = notvalue;
								var pseudoselector = findmatch.getTagWithPseudo(code,null,selector);
								if(pseudoselector)
									return true;
								else
									return false;
							}
						}
					}
				}
			}
		}
		return false;
	},
	getComplexSelectors: function(css_complex_selectors,viewcode){
		var xtracss_complex_selectors = {};

		for(var j in css_complex_selectors) {
			var unusedCss=[];
			var complex_css_array = css_complex_selectors[j];
			var selectorarray = complex_css_array.selector;

			for(var i in selectorarray){
				var is_complex_attribute = this.compare_complexAttributes(selectorarray[i]);
				if(!is_complex_attribute){
					var selectorsplit = selectorarray[i].split(' ');
					foundmatch = getunusedcss.findUnusedSelectors(viewcode,selectorsplit);
					if(unusedCss.indexOf(selectorarray[i]) === -1 && !foundmatch){
						unusedCss.push(selectorarray[i]);
					}
				}
			}

			if (complex_css_array.selector.length > 0) {
				xtracss_complex_selectors[j] = {};
				xtracss_complex_selectors[j].filename = complex_css_array.filename;
				xtracss_complex_selectors[j].selector = unusedCss;
			}
		}
		return Q(xtracss_complex_selectors);
	}
}

