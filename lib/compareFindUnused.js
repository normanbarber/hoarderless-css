var _ = require('underscore');
var findmatch = require('../lib/compareFindMatch.js');
var compareparser = require('../lib/compareParser.js');
var transform = require('../lib/parserTransform.js');
module.exports = {
	getSingleSelectors: function(viewcode,selectorsplit){
		/*  input: */
		/*  viewcode: string ( code from the view files ) */
		/*  selectorsplit: array of current selector ( single selector - p.someclass ) */

		/*  out:  returns true or false depends on if the selector found a match in the viewcode */
		var selector =  compareparser.cssParser(viewcode,selectorsplit[0]);
		var tag = compareparser.getTags(viewcode,selector);
		return tag.length > 0 ? true : false;
	},
	getComplexSelectors: function(viewcode,selectorsplit){
		/*  input: */
		/*  viewcode: string ( code from the view files ) */
		/*  selectorsplit: array of current 2 selectors and 1 operator if present  ( complex selector - div#container > p.someclass:last-child ) */

		/*  out:  returns true or false depends on if the selector found a match in the viewcode */

		var operators = {};
		operators.regex_operators =  />|\+|~/g;
		var selectorarray = selectorsplit.splice(0,3);
		operators.operator1 = selectorarray[0].match(operators.regex_operators);
		operators.operator2 = selectorarray[1].match(operators.regex_operators);

		var selector = this.splitComplexSelectors(selectorarray,selectorsplit,operators);
		operators.operator = selector.operator;

		var dom = JSON.parse(viewcode);

		var tag1 = compareparser.cssParser(viewcode,selector.selector1);
		var tags = compareparser.getTags(viewcode,tag1);
		var tag2 = compareparser.cssParser(viewcode,selector.selector2);

		if(!tags.length > 0 || !tag2)
			return false;

		viewcode = findmatch.updateTreeStructure(dom,tags[0],operators.operator);
		if(viewcode){

			var comparecomplex = require('../lib/compareComplex.js');
			var operatormatch = comparecomplex.identifyOperator(operators.operator, tags, tag2, selector.selector2);
			if(!operatormatch){
				return false;
			}
			else if(operatormatch && selectorsplit.length <= 1){
				return operatormatch
			}else{
				return this.getComplexSelectors(viewcode,selectorsplit);
			}

		}else{
			return false;
		}
		return this.getComplexSelectors(viewcode,selectorsplit);
	},
	splitComplexSelectors: function(selectorarray,selectorsplit,operators){

		/*  input: */
		/*  selectorarray: original array of selectors*/
		/*  selectorsplit: array of current 2 selectors and 1 operator if present */
		/*  operators: array of operators in orignal selector */

		/*  out:  object ie selector : {operator:string, selector1:string, selector2:string */
		var selectors = {};
		if(operators.operator1 || operators.operator2){
			if(selectorsplit.length >= 1)
				selectorsplit.unshift(selectorarray[2]);
			if(operators.operator1){
				return true;
			}
			if(operators.operator2){
				selectors.selector1 = selectorarray[0];
				selectors.selector2 = selectorarray[2];
				selectors.operator = selectorarray[1];
			}
		}else{
			if(selectorsplit.length >= 1 || (selectorarray.length === 3 && !operators.operator1 && !operators.operator2)){
				selectorsplit.unshift(selectorarray[2]);
				selectorsplit.unshift(selectorarray[1]);
			}
			selectors.selector1 = selectorarray[0];
			selectors.selector2 = selectorarray[1];
			selectors.operator = null;
		}
		return selectors;
	}
}

