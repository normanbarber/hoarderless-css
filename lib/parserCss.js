var cleancode = require('../lib/parserCleanCode.js');

module.exports = {

	/*  loop through css files identifying
		all selctors: classes, ids, tags, pseudo and complex */

	start: function(filename,cssrule){
		var complex_array = [];
		var attributes_array = [];
		var allclasses = [];
		var allids = [];
		var alltags = [];
		var css = {};
		for(var i in cssrule){
			var altcss = cssrule[i].match(/@|%|from\b|to\b/g);
			if(!altcss){
				var selectorsplit = cssrule[i].split(',');
				for(var s=0; s < selectorsplit.length; s++){
					var cleanedcode = selectorsplit[s].replace(/\s{2,} /g,"");
					this.identifySelectorProperties(cleanedcode,selectorsplit[s],complex_array,attributes_array,allclasses,allids,alltags);
				}
			}
		}
		css.classes = allclasses;
		css.ids = allids;
		css.tags = alltags;
		css.complexselectors = complex_array;
		css.attributes = attributes_array;
		return css;
	},
	identifySelectorProperties: function(cleanedcode,selector,complex_array,attributes_array,allclasses,allids,alltags){
		var regex_complex_operators =  />|\+|~|\s*\:\s*first-child|\s*\:\s*nth-child|\s*\:\s*last-child|\s*\:\s*not/g;
		var regex_attribute_selectors =  /\[(.*?)(?=\])/g;
		var regex_pseudo_selectors =  /(.*?)(?=\:[a-z])/g;
		var complex_selectors = selector.match(regex_complex_operators);
		var attribute_selectors = selector.match(regex_attribute_selectors);
		var pseudo_selectors = selector.match(regex_pseudo_selectors);

		if(selector.slice(0,1) === '*')
			return;

		var nthchild = selector.match(/\s*\:\s*first-child|\s*\:\s*nth-child|\s*\:\s*last-child|\s*\:\s*not/g);
		if(nthchild)
			selector =  selector.replace(/\s*:\s*/g,":");

		selector =  selector.replace(/\s{2,}/g," ").replace(/^\s+|\s+$/g,'');
		if(complex_selectors)
			return complex_array.push(selector);

		var multiselector = selector.split(' ');
		var multiselectorarray = cleancode.removeEmpty(multiselector);

		cleanedcode = cleanedcode.replace(/^\s+|\s+$/g,'');
		var chainedclasses = cleanedcode.split('.');  // this line will split all complex class selectors like  .classone.classtwo
		var chainedids = cleanedcode.split('#');
		chainedclasses = cleancode.removeEmpty(chainedclasses);
		chainedids = cleancode.removeEmpty(chainedids);

		/*  return selectors chained together .classone.classtwo or #idone#idtwo.classone */
		if(chainedclasses.length >= 2 || chainedids.length >= 2)
			return complex_array.push(selector);

		/*  return child  h1 h2 or ul li*/
		if(multiselectorarray.length >= 2)
			return complex_array.push(selector);

		/*  return attribute selectors */
		if(attribute_selectors)
			return attributes_array.push(selector);

		/*  return class */
		if(cleanedcode.slice(0,1) === '.'){
			var classes = cleanedcode.replace(/\.|\s*/g,"");
			return allclasses.push(classes);
		}

		/*  return id */
		if(cleanedcode.slice(0,1) === '#'){
			var ids = cleanedcode.replace(/\#|\s*/g,"");
			return allids.push(ids);
		}

		/*  return pseudo selector */
		if(pseudo_selectors && !nthchild){
			for(var i in pseudo_selectors){
				pseudo_selectors[i] = pseudo_selectors[i].replace(/\:/g,"");
				if(pseudo_selectors[i])
					return alltags.push(pseudo_selectors[i]);
			}
		}

		/*  return tag  */
		if(selector.slice(0,1) != '.' && selector.slice(0,1) != '#' && selector){
			var tags = selector.replace(/\s*/g,"");
			return alltags.push(tags);
		}
	}
};
