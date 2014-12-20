var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');
module.exports = {
	filterNthChild: function(tag1, tag2, n, operator){
		tag2.tag = tag2.tag ? tag2.tag : '*';
		return _.find(tag1, function(code){
			var index=0;
			var subtreetype = operator === '>' ? code.children : code.siblings;
			return _.find(subtreetype, function(tag){
				var matchfound = tag2.attributes ? findmatch.getTagWithAttributes(tag.attributes,tag2.attributes) : tag.tag === tag2.tag || tag2.tag === '*';
				if(matchfound && (tag.tag === tag2.tag || tag2.tag === '*'))
					index++;

				return index >= parseInt(n) ? true : null;
			})
		});
	},
	filterFirstChild: function(tag1, tag2, n){
		return _.find(tag1, function(tag){
			var matchfound = tag2.attributes ? findmatch.getTagWithAttributes(tag.children[0].attributes,tag2.attributes) : tag.children[0].tag === tag2.tag;
			return matchfound ? true : false;
		})
	},
	filterLastChild: function(tag1, tag2, n){
		return _.find(tag1, function(tag){
			var lastchildindex = tag.children.length - 1;
			var matchfound = tag2.attributes ? findmatch.getTagWithAttributes(tag.children[lastchildindex].attributes,tag2.attributes) : tag.children[lastchildindex].tag === tag2.tag;
			return matchfound ? true : false;
		})

	},
	compareNthChild: function(tag1, tag2, selector2, n, operator){
		// :nth-child
		return this.filterNthChild(tag1, tag2, n, operator) ? true : false;
	},
	compareFirstChild: function(tag1, tag2, selector2, n){
		// :first-child
		return this.filterFirstChild(tag1, tag2, n) ? true : false;
	},
	compareLastChild: function(tag1, tag2, selector2, n){
		// :last-child
		return this.filterLastChild(tag1, tag2, n) ? true : false;
	}
}

