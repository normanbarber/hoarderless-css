var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');
module.exports = {
	filterNthChild: function(tag1, tag2, n, operator){
		tag2.tag = tag2.tag ? tag2.tag : '*';
		return _.find(tag1, function(code){
			var index=0;
			var subtreetype = (operator === '~' || operator === '+') ? null : code.children;
            if(!subtreetype)
                return false;
			return _.find(subtreetype, function(tag){
				var matchfound = tag2.attributes ? findmatch.getTagWithAttributes(tag.attributes,tag2.attributes) : tag.tag === tag2.tag || tag2.tag === '*';
				if(matchfound && (tag.tag === tag2.tag || tag2.tag === '*'))
					index++;

				return index >= parseInt(n) ? true : null;
			})
		});
	},
	filterFirstChild: function(tag1, tag2, n, operator){
		return _.find(tag1, function(tag){
            return (operator === '>' || operator === null) ? tag.children[0].tag === tag2.tag  || (tag2.tag === '*' && tag.children.length > 0) : tag1[0].tag === tag2.tag || (tag2.tag === '*'  && tag.siblings.length > 0);
		})
	},
	filterLastChild: function(tag1, tag2, n, operator){
		return _.find(tag1, function(tag){
            var lastchildindex = tag.children.length - 1;
            return (operator === '>' || operator === null) ? tag.children[lastchildindex].tag === tag2.tag  || (tag2.tag === '*' && tag.children.length > 0) : tag1[tag1.length - 1].tag === tag2.tag || (tag2.tag === '*'  && tag.siblings.length > 0);
		})
	},
	compareNthChild: function(tag1, tag2, selector2, n, operator){
		// :nth-child
		return this.filterNthChild(tag1, tag2, n, operator) ? true : false;
	},
	compareFirstChild: function(tag1, tag2, selector2, n, operator){
		// :first-child
		return this.filterFirstChild(tag1, tag2, n, operator) ? true : false;
	},
	compareLastChild: function(tag1, tag2, selector2, n, operator){
		// :last-child
		return this.filterLastChild(tag1, tag2, n, operator) ? true : false;
	}
}

