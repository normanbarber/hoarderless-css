var comparecomplex = require('../lib/compareComplex.js');
var findmatch = require('../lib/compareFindMatch.js');
var compareparser = require('../lib/compareParser.js');

module.exports = {
	findUnusedSelectors: function(viewcode,selectorsplit){
		var regex_operators =  />|\+|~/g;
		var selector1;
		var selector2;
		var operator;
		var selectors;

		if(selectorsplit.length === 1){

			var tagselector = findmatch.getTagSelector(selectorsplit[0]);
			var tag = compareparser.cssParser(viewcode,selectorsplit[0],tagselector);

			if(!tag)
				return false;

			var dom = JSON.parse(viewcode);

			selectors = findmatch.getTagWithPseudo(dom,null,tag);
			if(!selectors)
				return false;

			var onetag = findmatch.getTag(dom,selectors,null);
			if(!onetag)
				return false;
			else
				return true;
		}

		var selectorarray = selectorsplit.splice(0,3);
		var operator1 = selectorarray[0].match(regex_operators);
		var operator2 = selectorarray[1].match(regex_operators);

		if(operator1 || operator2){
			if(selectorsplit.length >= 1)
				selectorsplit.unshift(selectorarray[2]);
			if(operator1){
				return true;
			}
			if(operator2){
				selector1 = selectorarray[0];
				selector2 = selectorarray[2];
				operator = selectorarray[1];
			}
		}else{
			if(selectorsplit.length >= 1 || (selectorarray.length === 3 && !operator1 && !operator2)){
				selectorsplit.unshift(selectorarray[2]);
				selectorsplit.unshift(selectorarray[1]);
			}
			selector1 = selectorarray[0];
			selector2 = selectorarray[1];
			operator = null;

		}

		var tagselector = findmatch.getTagSelector(selector1);
		var tag1 = compareparser.cssParser(viewcode,selector1,tagselector);

		if(!tag1)
			return false;

		var dom = JSON.parse(viewcode);
		selectors = findmatch.getTagWithPseudo(dom,operator,tag1);

		if(!selectors)
			return false;
		viewcode = findmatch.getTag(dom,selectors,operator);

		if(viewcode){
			var tagselector = findmatch.getTagSelector(selector2);
			var tag2 = compareparser.cssParser(viewcode,selector2,tagselector);

			if(!tag2)
				return false;

			dom = JSON.parse(viewcode);

			var matchfound = findmatch.getTagWithPseudo(dom,operator,tag2);
			if(!matchfound)
				return false;

			var filetag;
			var dom = JSON.parse(viewcode);
			if(selectorsplit.length <= 1 && matchfound){
				if(operator){
					return true;
					var operatormatch = comparecomplex.identifyOperator(dom, operator, tag1, matchfound);
					if(!operatormatch){
						return false;
					}else{
						return true;
					}

				}else{
					return true;
					var operatormatch = comparecomplex.identifyOperator(dom, operator, tag1, matchfound);
					filetag = findmatch.getTag(dom,matchfound,operator);
					if(filetag && operatormatch){
						return filetag
					}else{
						return false;
					}
				}

			}else if(!matchfound){
				return false;
			}
		}else{
			return false;
		}
		return this.findUnusedSelectors(viewcode,selectorsplit);
	}
}

