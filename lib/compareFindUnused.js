var findmatch = require('../lib/compareFindMatch.js');
var compareparser = require('../lib/compareParser.js');

module.exports = {
    findUnusedSelectors: function(viewcode,selectorsplit){
        var regex_operators =  />|\+|~/g;
        var selectors;

        if(selectorsplit.length === 1){
            var foundmatch = this.compareCssSingleSelector(viewcode,selectorsplit);
            if(foundmatch)
                return true;
            else
                return false;
        }

        var selectorarray = selectorsplit.splice(0,3);
        var operator1 = selectorarray[0].match(regex_operators);
        var operator2 = selectorarray[1].match(regex_operators);

        var selector = this.compareCssMultiSelector(selectorarray,selectorsplit,operator1,operator2);
        var operator = selector.operator;

        var tag = this.getTagAttributes(viewcode,selector.selector1,operator);
        var tagname = tag.tag;
        selectors = tag.selectors;

        if(!tagname || !selectors)
            return false;

        var dom = JSON.parse(viewcode);
        viewcode = findmatch.getTag(dom,selectors,operator);
        if(viewcode){

            var tag = this.getTagAttributes(viewcode,selector.selector2,operator);
            selectors = tag.selectors;

            if(!selectors)
                return false;

            var comparecomplex = require('../lib/compareComplex.js');
            var dom = JSON.parse(viewcode);
            if(selectorsplit.length <= 1){

                var operatormatch = comparecomplex.identifyOperator(dom, operator, tagname, selectors);
                var filetag = findmatch.getTag(dom,selectors,operator);
//                console.log(filetag);
                if(filetag && operatormatch){
                    return filetag
                }else{
                    return false;
                }

            }

//
//            var selectorused = this.compareSelectorGroup(viewcode,selectorsplit,selectors,operator,tagname);
//
//            if(selectorused){
//                console.log(selectorused.filetag);
//                return selectorused.filetag;
//            }else{
//                return false;
//            }

        }else{
            return false;
        }
        return this.findUnusedSelectors(viewcode,selectorsplit);
    },
    getTagAttributes: function(viewcode,selectors,operator){

        /*  if the current tag is not found in the view code return false
            otherwise continue checking the css selector if uses a pseudo */

        var selector = {};
        var tagselector = findmatch.getTagSelector(selectors);
        var tag = compareparser.cssParser(viewcode,selectors,tagselector);
        if(!tag)
            return false;

        var dom = JSON.parse(viewcode);
        var matchfound = findmatch.getTagWithPseudo(dom,operator,tag);

        selector.tag = tag;
        selector.selectors = matchfound;
        return selector;

    },
    compareCssSingleSelector: function(viewcode,selectorsplit){

        /*  current rule has a single selector ie p.one */

        var selector = this.getTagAttributes(viewcode,selectorsplit[0],null);
        if(!selector)
            return false;

        var dom = JSON.parse(viewcode);
        var tag = findmatch.getTag(dom,selector.selectors,null);
        if(!tag)
            return false;
        else
            return true;

    },
    compareCssMultiSelector: function(selectorarray,selectorsplit,operator1,operator2){

        /*  current rule has a multi selector ie table.tabledata.table.one */

        var selectors = {};
        if(operator1 || operator2){
            if(selectorsplit.length >= 1)
                selectorsplit.unshift(selectorarray[2]);
            if(operator1){
                return true;
            }
            if(operator2){
                selectors.selector1 = selectorarray[0];
                selectors.selector2 = selectorarray[2];
                selectors.operator = selectorarray[1];
            }
        }else{
            if(selectorsplit.length >= 1 || (selectorarray.length === 3 && !operator1 && !operator2)){
                selectorsplit.unshift(selectorarray[2]);
                selectorsplit.unshift(selectorarray[1]);
            }
            selectors.selector1 = selectorarray[0];
            selectors.selector2 = selectorarray[1];
            selectors.operator = null;
        }
        return selectors;
    },
    compareSelectorGroup: function(viewcode,selectorsplit,selectors,operator,tagname){
        var comparecomplex = require('../lib/compareComplex.js');
        var dom = JSON.parse(viewcode);
        var obj = {};
        if(selectorsplit.length <= 1){

            var operatormatch = comparecomplex.identifyOperator(dom, operator, tagname, selectors);
            var filetag = findmatch.getTag(dom,selectors,operator);

            if(filetag && operatormatch){
                obj.filetag = filetag;
                obj.operatormatch = operatormatch;
                return obj
            }else{
                return false;
            }

        }else if(!selectors){
            return false;
        }

    }
}

