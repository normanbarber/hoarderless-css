var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');

module.exports = {
	filterDirectChildren: function(tag1, tag2){
		// inputs 2 selectors  at a time, ie (div#container > p.someclass  where tag1 == div#container and tag2 == p.someclass)
		tag2.tag = tag2.tag ? tag2.tag : '*';
		return _.find(tag1, function(code){
			return _.find(code.children, function(tag){
				var matchfound =  tag2.attributes ? findmatch.getTagWithAttributes(tag.attributes,tag2.attributes) && (tag.tag === tag2.tag || tag2.tag === '*') : tag.tag === tag2.tag || tag2.tag === '*';
				return matchfound && tag.treenode - 1 === code.treenode  ? true : false;
			})
		});
	},
	compareDirectChildren: function(tag1, tag2){
		//  direct children  (  >  )
		return  this.filterDirectChildren(tag1, tag2) ? true : false;

	}
}

