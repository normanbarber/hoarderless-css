var Q = require('q');
var _ = require('underscore');
var getunusedcss = require('../lib/compareFindUnused.js');
var findmatch = require('../lib/compareFindMatch.js');
var compareparser = require('../lib/compareParser.js');
var siblings = require('../lib/selectors/siblings.js');
var adjacent = require('../lib/selectors/adjacent.js');
var directchild = require('../lib/selectors/directChild.js');
var nchild = require('../lib/selectors/nChild.js');
module.exports = {

	identifyOperator: function(viewcode, operator, tag1, tag2){

		var operatorfound;
		var code = this.getArray(viewcode);
		if(!operator)
			operatorfound = directchild.compare_DirectChildren(code, tag2, tag1);
		else if(tag2.tag.match(/:[a-zA-Z-]+/) == ':nth-child'){
			var nthvalue = tag2.tag.match(/\((.*)\)/);
			var nthchild = nthvalue[1];
			if(tag2.tag.match(/:[a-zA-Z-]+/) == ':nth-child'){
				tag2.tag = tag2.tag.replace(/\(.*?\)/g,"").replace(/:nth-child/g,"");
				operatorfound = nchild.compareNthChild(code, tag2, tag1, nthchild);
			}
		}
		else if(tag2.tag.match(/:[a-zA-Z-]+/) == ':first-child'){
			var nthvalue = tag2.tag.match(/\((.*)\)/);
			var nthchild = 1;
			if(tag2.tag.match(/:[a-zA-Z-]+/) == ':first-child'){
				tag2.tag = tag2.tag.replace(/\(.*?\)/g,"").replace(/:first-child/g,"");
				operatorfound = nchild.compareFirstChild(code, tag2, tag1, nthchild);
			}
		}
		else if(tag2.tag.match(/:[a-zA-Z-]+/) == ':last-child'){
			var nthvalue = tag2.tag.match(/\((.*)\)/);
			var nthchild = 1;
			if(tag2.tag.match(/:[a-zA-Z-]+/) == ':last-child'){
				tag2.tag  = tag2.tag.replace(/\(.*?\)/g,"").replace(/:last-child/g,"");
				operatorfound = nchild.compareLastChild(code, tag2, tag1, nthchild);
			}
		}
		else if(tag2.tag.match(/:[a-zA-Z-]+/) == ':not'){
			var notvalue = tag2.tag.match(/\((.*)\)/);
			notvalue = notvalue[1];
			tag2.tag = tag2.tag.replace(/\(+.*?\)+/g,"").replace(/:not/g,"");
			operatorfound = this.compare_negation(viewcode, tag2.attributes, tag2, notvalue);
		}
		else if(tag2.tag.match(/\[(.*?)(?=\])/g)){
			var attrvalue = tag2.tag.match(/\[.*?\]/g);
			tag2.tag = tag2.tag.replace(/\[.*?\]/g,"");

			operatorfound = this.compare_attributes(viewcode, tag2.tag, attrvalue);
		}
		else if(operator.match(/>/g))
			operatorfound = directchild.compare_DirectChildren(code, tag2, tag1);
		else if(operator.match(/~/g))
			operatorfound = siblings.compareSiblings(code, tag2, tag1);
		else if(operator.match(/\+/g))
			operatorfound = adjacent.compareAdjacent(code, tag2, tag1);

		return operatorfound;
	},
	getArray: function(viewcode){

		var filterdirectchild;
		_.each(viewcode, function(code){

			var dom = code.dom;

			filterdirectchild =  _.each(dom, function(tag){
				return tag;
			})
		})
		return filterdirectchild;

	},
	// todo - simplify and move to own module
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
	// todo - simplify and move to own module
	compare_negation: function(viewcode, attributes, tag, notvalue){

		// negation  (  :not()  )

		var matchtag;
		var element;
		var view = JSON.stringify(viewcode);
		var selectorname = tag.tag;
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
			var tagname;
			var classarray = [];
			var idarray = [];
			if(notvalue.slice(0,1) === '#'){
				tagname = notvalue.split('#');
				idarray.push(tagname[1]);
			}

			if(notvalue.slice(0,1) === '.'){
				tagname = notvalue.split('.');
				classarray.push(tagname[1]);
			}
			for(var i in viewcode){
				for(var j in viewcode[i].dom){
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
						tag = tag ? tag[0].slice(0,-1) : notvalue;
//                        var somevar = findmatch.getTagWithAttributes(viewcode[i].dom[j].attributes,attributes);
						var tagchildren = file[j].children; // checks tag. need to check attrs
						for(var k in tagchildren){
							if(tagchildren[k] === tag){
								return true;
							}
						}
					}
				}
			}
		}
		return false;
	},
	getComplexSelectors: function(css_complex_selectors,viewcode){
		var unused_selectors = {};
		var self = this;
		_.each(css_complex_selectors, function(complex_css_array,key){
			var unusedCss=[];
			var selectorarray = complex_css_array.selector;

			_.each(selectorarray, function(semper){
				var is_complex_attribute = self.compare_complexAttributes(semper);
				if(!is_complex_attribute){
					var selectorsplit = semper.split(' ');
					foundmatch = getunusedcss.findUnusedSelectors(viewcode,selectorsplit);
					if(unusedCss.indexOf(semper) === -1 && !foundmatch){
						unusedCss.push(semper);
					}
				}
			});

			if (complex_css_array.selector.length > 0) {
				unused_selectors[key] = {};
				unused_selectors[key].filename = complex_css_array.filename;
				unused_selectors[key].selector = unusedCss;
			}
		})
		return Q(unused_selectors);
	}
}

