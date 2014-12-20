var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');
module.exports = {
	filterAdjacent: function(tag1, tag2){
		// inputs 2 selectors  at a time, ie (div#container + p.someclass  where tag1 == div#container and tag2 == p.someclass)
		tag2.tag = tag2.tag ? tag2.tag : '*';
		return _.find(tag1, function(code){
			if(!code.siblings[0])
				return false;
			var matchfound = tag2.attributes  ? (findmatch.getTagWithAttributes(code.siblings[0].attributes,tag2.attributes) && code.siblings[0].tag === tag2.tag || tag2.tag === '*') : code.siblings[0].tag === tag2.tag || tag2.tag === '*';
			return matchfound ? true : false;
		})
	},
	compareAdjacent: function(tag1, tag2){
		// adjacent  (  +  )
		return this.filterAdjacent(tag1, tag2) ? true : false;
	}
}

