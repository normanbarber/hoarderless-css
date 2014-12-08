var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');
module.exports = {
	filterNthChild: function(viewcode, tag2, tag1, n){

		return _.find(viewcode, function(tag){
			var index=0;
			matchfound = tag1.selectors ? findmatch.getTagWithAttributes(tag.attributes,tag1.selectors) : tag.tag === tag1.tag;
			var hasChild =  _.find(tag.children, function(tagchild){
				if(tagchild === tag2.tag)
					index++;

				if(index >= parseInt(n))
					return true;

			})
			return (matchfound && hasChild) ? true : null;
		})
	},
	filterFirstChild: function(viewcode, tag2, tag1, n){
		return _.find(viewcode, function(tag){
			matchfound = tag1.selectors ? findmatch.getTagWithAttributes(tag.attributes,tag1.selectors) : tag.tag === tag1.tag;
			return (matchfound && tag.children[0] === tag2.tag) ? true : null;
		})
	},
	filterLastChild: function(viewcode, tag2, tag1, n){
		return _.find(viewcode, function(tag){
			matchfound = tag1.selectors ? findmatch.getTagWithAttributes(tag.attributes,tag1.selectors) : tag.tag === tag1.tag;
			var lastchildindex = tag.children.length - 1;
			return (matchfound && tag.children[lastchildindex] === tag2.tag) ? true : null;
		})
	},
	compareNthChild: function(viewcode, tag2, tag1, n){
		// :nth-child
		return this.filterNthChild(viewcode, tag2, tag1, n) ? true : false;
	},
	compareFirstChild: function(viewcode, tag2, tag1, n){
		// :first-child
		return this.filterFirstChild(viewcode, tag2, tag1, n) ? true : false;
	},
	compareLastChild: function(viewcode, tag2, tag1, n){
		// :last-child
		return this.filterLastChild(viewcode, tag2, tag1, n) ? true : false;
	}
}

