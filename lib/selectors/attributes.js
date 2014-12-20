var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');
module.exports = {
	filterAttributes: function(tag1, tag2, attribute, operator){
		var self = this;

		attribute = attribute[0].toString().replace(/'|\[|\]/g,"");
		tag2.tag = tag2.tag ? tag2.tag : '*';
		var attribute_array = attribute.split(',');
		tag2.attributes = attribute_array[0];
		return _.find(tag1, function(code){
			var subtreetype = operator === '>' ? code.children : code.siblings;
			var attrmatcher;
			return _.find(subtreetype, function(tag){
				if(tag2.attributes && tag2.attributes.match(/class="(.*?)"/gm) || tag2.attributes.match(/id="(.*?)"/gm)){
					attrmatcher = findmatch.getTagWithAttributes(tag.attributes,tag2.attributes);
				}else{
					attrmatcher = self.matchAttributes(tag.attributes,tag2.attributes);
				}
				var matchfound = tag2.attributes ? attrmatcher  : tag.tag === tag2.tag ;
				return  matchfound && (tag.tag === tag2.tag || tag2.tag === '*') ? true : false;
			});
		})
	},
	matchAttributes: function(viewattributes, attribute){
		return viewattributes.match(attribute) ? true : false;
	},
	compare_complexAttributes: function(selector){
		return selector.match(/\^\=|\*\=|\?\=/g) ? true : false;
	},
	compareAttributes: function(tag1, tag2, attribute, operator){
		// attribute  [ someattribute="somevalue" ]
		return this.filterAttributes(tag1, tag2, attribute, operator) ? true : false;
	}
}

