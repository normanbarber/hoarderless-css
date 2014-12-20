var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');
module.exports = {
	filterSiblings: function(tag1, tag2){
		// inputs 2 selectors  at a time,  ie (div#container ~ p.someclass  where tag1 == div#container and tag2 == p.someclass)
		tag2.tag = tag2.tag ? tag2.tag : '*';
		return _.find(tag1, function(code){
			return _.find(code.siblings, function(tag){
				var matchfound = tag2.attributes ? (findmatch.getTagWithAttributes(tag.attributes,tag2.attributes) && (tag.tag === tag2.tag || tag2.tag === '*')) : tag.tag === tag2.tag || tag2.tag === '*';
				return matchfound ? true : false;
			})
		});
	},
	compareSiblings: function(tag1, tag2){
		// sibling ( ~ )
		return this.filterSiblings(tag1, tag2) ? true : false;
	}
}

