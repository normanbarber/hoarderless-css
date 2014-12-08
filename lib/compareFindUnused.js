var findmatch = require('../lib/compareFindMatch.js');
var compareparser = require('../lib/compareParser.js');

module.exports = {
	findUnusedSelectors: function(viewcode,selectorsplit){
		var operators = {};
		operators.regex_operators =  />|\+|~/g;
		if(selectorsplit.length === 1){
			var foundmatch = this.compareCssSingleSelector(viewcode,selectorsplit);
			if(foundmatch)
				return true;
			else
				return false;
		}

		var selectorarray = selectorsplit.splice(0,3);
		operators.operator1 = selectorarray[0].match(operators.regex_operators);
		operators.operator2 = selectorarray[1].match(operators.regex_operators);

		var selector = this.compareCssMultiSelector(selectorarray,selectorsplit,operators);
		operators.operator = selector.operator;

		var dom = JSON.parse(viewcode);
		var tag1 = compareparser.cssParser(viewcode,selector.selector1);
		var tag2 = compareparser.cssParser(viewcode,selector.selector2);

		if(!tag1 || !tag2)
			return false;


		viewcode = findmatch.getTag(dom,tag1,operators.operator);
		if(viewcode){

			var comparecomplex = require('../lib/compareComplex.js');
			var dom = JSON.parse(viewcode);

			var operatormatch = comparecomplex.identifyOperator(dom, operators.operator, tag1, tag2);

			var filetag = findmatch.getTag(dom,tag2,operators.operator);
			if(!filetag || !operatormatch){
				return false;
			}
			else if(filetag && operatormatch && selectorsplit.length <= 1){
				return filetag
			}else{
				return this.findUnusedSelectors(viewcode,selectorsplit);
			}

		}else{
			return false;
		}
		return this.findUnusedSelectors(viewcode,selectorsplit);
	},
	compareCssSingleSelector: function(viewcode,selectorsplit){

		/*  current rule has a single selector ie p.one */

		var selector = compareparser.cssParser(viewcode,selectorsplit[0]);
		if(!selector)
			return false;

		return true;

	},
	compareCssMultiSelector: function(selectorarray,selectorsplit,operators){

		/*  current rule has a multi selector ie table.tabledata.table.one */

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

