var fs = require('fs');
var Q = require('q');
var comparecomplex = require('../lib/compareComplex.js');
var findmatch = require('../lib/compareFindMatch.js');
var compareparser = require('../lib/compareParser.js');
var _ = require('underscore');

var compareCode = {
	start: function (selectors) {
		var self = this;
		var xtracss_classes = {};
		var xtracss_ids = {};
		var xtracss_tags = {};
		var xtracss_attributes = {};
		var xtracss_complex_selectors = {};
		var xtracss = {};

		var css_complex_selectors = selectors.css.selectors.complexselectors;
		var css_classes = selectors.css.selectors.classes;
		var css_ids = selectors.css.selectors.ids;
		var css_tags = selectors.css.selectors.tags;
		var css_attributes = selectors.css.selectors.attributes;
		var view_classes = selectors.view.selectors.classes;
		var view_ids = selectors.view.selectors.ids;
		var view_attributes = JSON.stringify(selectors.view.selectors.attributes);
		var view_code = JSON.stringify(selectors.view.selectors.viewcode);

		var all = [];
		var promise = null;
		var errordata = {};

		promise = self.compareComplexSelectors(css_complex_selectors, view_code)
			.then(function(css_complex_selectors){
				xtracss_complex_selectors = css_complex_selectors;

				var usedclasses = [];
				for(var i in css_classes){
					xtracss_classes[i] = {};

					var classarray = css_classes[i];
					var xtracss_classes_tmp = [];
					for(var j in classarray.selector){

						for(var k in view_classes){

							var viewfile = view_classes[k];
							for(var m in viewfile){
								if(viewfile[m].selector === classarray.selector[j]){
									usedclasses.push(classarray.selector[j]);
								}

							}
						}
						if(usedclasses.indexOf(classarray.selector[j]) === -1 && xtracss_classes_tmp.indexOf(classarray.selector[j]) === -1){
							xtracss_classes_tmp.push(classarray.selector[j]);
						}
					}
					xtracss_classes[i].filename = classarray.filename;
					xtracss_classes[i].selector = xtracss_classes_tmp;
				}

			})
			.then(function(){
				var usedids = [];
				for(var i in css_ids){
					xtracss_ids[i] = {};
					var idsarray = css_ids[i];
					var xtracss_ids_tmp = [];
					for(var j in idsarray.selector){
						for(var k in view_ids){

							var viewfile = view_ids[k];
							for(var m in viewfile){
								if(viewfile[m].selector === idsarray.selector[j]){
									usedids.push(idsarray.selector[j]);
								}
							}
						}
						if(usedids.indexOf(idsarray.selector[j]) === -1 && xtracss_ids_tmp.indexOf(idsarray.selector[j]) === -1){
							xtracss_ids_tmp.push(idsarray.selector[j]);
						}

					}
					xtracss_ids[i].filename = idsarray.filename;
					xtracss_ids[i].selector = xtracss_ids_tmp;
				}

			})
			.then(function(){
				view_attributes = view_attributes.replace(/\"|\'|\\/g,"");
				var view_attributes_array = view_attributes.split(' ');
				var viewcode = JSON.parse(view_code);

				for(var i in css_attributes){
					xtracss_attributes[i] = {};
					var attributesarray = css_attributes[i];
					var xtracss_attributes_tmp = [];


					for(var j in attributesarray.selector){
						var selector = attributesarray.selector[j];
						var attributevalue = selector.match(/\[.*?\]/g);
						tag = selector.replace(/\[.*?\]/g,"");
						var attributefound = comparecomplex.compare_attributes(viewcode, tag, attributevalue);
						if(view_attributes.indexOf(attributesarray.selector[j]) === -1 && !attributefound)
							xtracss_attributes_tmp.push(selector);

					}

					xtracss_attributes[i].filename = attributesarray.filename;
					xtracss_attributes[i].selector = xtracss_attributes_tmp;
				}


			})
			.then(function(){
				var viewfiles = selectors.view.selectors.viewcode;

				for(var i in css_tags){
					xtracss_tags[i] = {};
					var tagsarray = css_tags[i];
					var tag = self.compareTags(viewfiles,tagsarray.selector);
					var sel =xtracss_tags[i].selector;

					if(tag){
						xtracss_tags[i].filename = tagsarray.filename;
						xtracss_tags[i].selector = tag;
					}

				}
			})
			.then(function(){
				xtracss.classes = xtracss_classes;
				xtracss.ids = xtracss_ids;
				xtracss.tags = xtracss_tags;
				xtracss.attributes = xtracss_attributes;
				xtracss.advanced = xtracss_complex_selectors;
				return xtracss;
			})
			.fail(function(error) {
				return error;
			});

		all.push(promise);

		if(all.length > 0){

			return Q.allResolved(all)
				.then(function(promises) {
					return Q(_.map(promises, Q.nearer));
				});
		}else{
			errordata.message = 'Error thrown while comparing css selectors with the view code';
			errordata.status = 'error';
			return Q.reject({error:errordata});
		}
	},
	compareTags: function(viewfiles,csstags){
		var unusedtags=[];
		for(var i in csstags){
			var usedinview = false;
			for(var j in viewfiles){
				var viewcode = viewfiles[j].dom;
				for(var k in viewcode){
					if(viewcode[k].tag === csstags[i]){
						usedinview=true;
					}
				}
			}
			if(!usedinview && unusedtags.indexOf(csstags[i]) === -1)
				unusedtags.push(csstags[i]);
		}
		return unusedtags;
	},
	compareComplexSelectors: function(css_complex_selectors,view_code){
		var xtracss_complex_selectors = {};

		for(var j in css_complex_selectors) {
			var unusedCss=[];
			var complex_css_array = css_complex_selectors[j];
			var selectorarray = complex_css_array.selector;

			for(var i in selectorarray){
				var is_complex_attribute = comparecomplex.compare_complexAttributes(selectorarray[i]);
				if(!is_complex_attribute){
					var selectorsplit = selectorarray[i].split(' ');
					foundmatch = this.findUnusedSelectors(view_code,selectorsplit);
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
	},
	findUnusedSelectors: function(viewcode,selectorsplit){
		var regex_operators =  />|\+|~/g;
		var selector1;
		var selector2;
		var operator;
		var selectors;

		if(selectorsplit.length === 1){
			var tagselector = this.getTagSelector(selectorsplit[0]);
			var tag = compareparser.cssParser(viewcode,selectorsplit[0],tagselector);
			if(!tag)
				return false;

			var dom = JSON.parse(viewcode);

			selectors = this.findMatches(dom,null,tag);
			if(!selectors)
				return false;

			var onetag = findmatch.matchTags(dom,selectors,null);
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

		var tagselector = this.getTagSelector(selector1);
		var tag1 = compareparser.cssParser(viewcode,selector1,tagselector);

		if(!tag1)
			return false;

		var dom = JSON.parse(viewcode);
		selectors = this.findMatches(dom,operator,tag1);

		if(!selectors)
			return false;
		viewcode = findmatch.matchTags(dom,selectors,operator);

		if(viewcode){
			var tagselector = this.getTagSelector(selector2);
			var tag2 = compareparser.cssParser(viewcode,selector2,tagselector);

			if(!tag2)
				return false;

			dom = JSON.parse(viewcode);

			var matchfound = this.findMatches(dom,operator,tag2);
			if(!matchfound)
				return false;

			var filetag;
			if(selectorsplit.length <= 1 && matchfound){
				if(operator){

					var dom = JSON.parse(viewcode);
					var operatormatch = comparecomplex.identifyOperator(dom, operator, tag1, matchfound);
					if(!operatormatch){
						return false;
					}else{
						return true;
					}

				}else{
					filetag = findmatch.matchTags(dom,matchfound,operator);
					if(filetag){
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
	},
	findMatches: function(viewcode,operator,selector){
		tagname = selector.tag;
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

			var notvaluefound = this.compare_negation(viewcode, selector.selectors, tagname, notvalue);
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
	},
	compare_negation: function(viewcode, attributes, selector, notvalue){
		// tag ->  negation  (  :not()  )
		var matchtag;
		var element;
		var code = JSON.stringify(viewcode);
		var tagselector = this.getTagSelector(selector);
		var tag = compareparser.cssParser(code,selector,tagselector);
		if(!tag)
			return false;

		var sel = this.findMatches(viewcode,null,tag);
		var onetag = findmatch.matchTags(viewcode,sel,null);
		onetag = JSON.parse(onetag);

		if(notvalue.slice(0,1) === '.' || notvalue.slice(0,1) === '#'){
			return true;
		}else{
			for(var i in onetag){
				var file = onetag[i].dom;
				for(var j in file) {
					matchtag = selector.match(file[j].tag);
					if(matchtag){
						element = file[j];

						var tagchildren = file[j].children;
						for(var k in tagchildren){
							if(tagchildren[k] === notvalue){
								return true;
							}
						}
					}
				}

			}
			return false;
		}
	}
}
module.exports.compareCode = compareCode;
module.exports = function(selectorsobj, callback) {
	compareCode.start(selectorsobj)
		.then(function(code){
			return callback(null, code);
		})
		.fail(function(err) {
			return callback(err, null);
		});
};

