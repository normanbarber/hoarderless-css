var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');
module.exports = {
	filterChildren: function(viewcode, tag2, tag1){
		// inputs 2 selectors  at a time, from the current complex selector ie (div#container > p.someclass  where tag1 == div#container and tag2 == p.someclass)
		return _.find(viewcode, function(tag){
			var matchfound = tag1.selectors ? findmatch.getTagWithAttributes(tag.attributes,tag1.selectors) : tag.tag === tag1.tag;
			return (matchfound && tag2.tabindents > tag.tabindents && _.contains(tag.children, tag2.tag)) ? true : null;
		})
	},
	compare_DirectChildren: function(viewcode, tag2, tag1){
		//  direct children  (  >  )
		return this.filterChildren(viewcode, tag2, tag1) ? true : false;
	}
}

