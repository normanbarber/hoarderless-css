var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');
module.exports = {
	filterAdjacent: function(viewcode, tag2, tag1){
		// inputs 2 selectors  at a time, from the current complex selector ie (div#container + p.someclass  where tag1 == div#container and tag2 == p.someclass)
		return _.find(viewcode, function(tag){
			var matchfound = tag1.attributes ? findmatch.getTagWithAttributes(tag.attributes,tag1.attributes) : tag.tag === tag1.tag;
			return (matchfound && tag.tabindents === tag2.tabindents && _.contains(tag.siblings, tag2.tag)) ? true : null;
		})
	},
	compareAdjacent: function(viewcode, tag2, tag1){
		// adjacent  (  +  )
		return this.filterAdjacent(viewcode, tag2, tag1) ? true : false;
	}
}

