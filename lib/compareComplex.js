var Q = require('q');
var _ = require('underscore');
var findunused = require('../lib/compareFindUnused.js');
var siblings = require('../lib/selectors/siblings.js');
var adjacent = require('../lib/selectors/adjacent.js');
var directchild = require('../lib/selectors/directChild.js');
var children = require('../lib/selectors/children.js');
var nchild = require('../lib/selectors/nChild.js');
var negation = require('../lib/selectors/negation.js');
var attributes = require('../lib/selectors/attributes.js');
module.exports = {

	identifyOperator: function(operator, tag1, tag2, selector2){

		/*
		input: takes in 4 arguments see example below
		out: returns selectorfound [ true or false ]

		[operator, tag1, tag2, selector2]

		operator : '>'

		tag1  : {
					tag: 'div',
					attributes: 'id="container"',
					children: [],
					siblings: [],
					tabindents: 4
				}

		tag2 :  {
				tag: 'span',
				attributes: 'class="someclass"',
				tabindents: 5
				}

		selector2 :  'span.someclass'

		*/

		var selectorfound;
		var pseudo = false;
		if(selector2 && selector2.match(/:[a-zA-Z-]+/) == ':nth-child' || selector2.match(/:[a-zA-Z-]+/) == ':first-child' || selector2.match(/:[a-zA-Z-]+/) == ':last-child' || selector2.match(/:[a-zA-Z-]+/) == ':not' || selector2.match(/\[(.*?)(?=\])/)){
			pseudo = true;
		}
		if(!operator)
			selectorfound = children.compareChildren(tag1, tag2);
		else if(operator.match(/>/g))
			selectorfound = directchild.compareDirectChildren(tag1, tag2);
		else if(operator.match(/~/g))
			selectorfound = siblings.compareSiblings(tag1, tag2);
		else if(operator.match(/\+/g))
			selectorfound = adjacent.compareAdjacent(tag1, tag2);

		if(pseudo && selectorfound){
			if(selector2.match(/:[a-zA-Z-]+/) == ':nth-child'){
				var nthvalue = selector2.match(/\((.*)\)/);
				var nthchild = nthvalue[1];
				if(selector2.match(/:[a-zA-Z-]+/) == ':nth-child'){
					selector2 = selector2.replace(/\(.*?\)/g,"").replace(/:nth-child/g,"");
					selectorfound = nchild.compareNthChild(tag1, tag2, selector2, nthchild, operator);
				}
			}
			else if(selector2.match(/:[a-zA-Z-]+/) == ':first-child'){
				var nthvalue = selector2.match(/\((.*)\)/);
				var nthchild = 1;
				if(selector2.match(/:[a-zA-Z-]+/) == ':first-child'){
					selector2 = selector2.replace(/\(.*?\)/g,"").replace(/:first-child/g,"");
					selectorfound = nchild.compareFirstChild(tag1, tag2, selector2, nthchild, operator);
				}
			}
			else if(selector2.match(/:[a-zA-Z-]+/) == ':last-child'){
				var nthvalue = selector2.match(/\((.*)\)/);
				var nthchild = 1;
				if(selector2.match(/:[a-zA-Z-]+/) == ':last-child'){
					selector2  = selector2.replace(/\(.*?\)/g,"").replace(/:last-child/g,"");
					selectorfound = nchild.compareLastChild(tag1, tag2, selector2, nthchild, operator);
				}
			}
			else if(selector2.match(/:[a-zA-Z-]+/) == ':not'){
				var notvalue = selector2.match(/\((.*)\)/);
				notvalue = notvalue[1];
				selector2 = selector2.replace(/\(+.*?\)+/g,"").replace(/:not/g,"");
				selectorfound = negation.compareNegation(tag1, tag2, notvalue);
			}
			else if(selector2.match(/\[(.*?)(?=\])/g)){
				var attrvalue = selector2.match(/\[.*?\]/g);
				selector2 = selector2.replace(/\[.*?\]/g,"");

				selectorfound = attributes.compareAttributes(tag1, tag2, attrvalue, operator);
			}
		}
		return selectorfound;
	},
	compare_complexAttributes: function(selector){
		/*

			input: takes in 1 argument a string of the css selector ie div#container
			out: returns boolean [ true or false ]

		*/
		return selector.match(/\^\=|\*\=|\?\=/g) ? true : false;
	},
	getComplexSelectors: function(css_complex_selectors,viewcode){
		var unused_selectors = {};
		var self = this;
		_.each(css_complex_selectors, function(complex_css_array,key){
			var unusedCss=[];
			var selectorarray = complex_css_array.selector;

			_.each(selectorarray, function(selector){
				var is_complex_attribute = self.compare_complexAttributes(selector);
				if(!is_complex_attribute){
					selector = selector.replace(/\>:/g,"> :").replace(/\~:/g,"~ :").replace(/\+:/g,"+ :");
					var selectorsplit = selector.split(/\s/g);
					foundmatch = (selectorsplit.length === 1) ? findunused.getSingleSelectors(viewcode,selectorsplit) : findunused.getComplexSelectors(viewcode,selectorsplit);
					if(unusedCss.indexOf(selector) === -1 && !foundmatch){
						unusedCss.push(selector);
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

