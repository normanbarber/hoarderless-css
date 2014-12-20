var _ = require('underscore');
var findmatch = require('../../lib/compareFindMatch.js');
var compareparser = require('../../lib/compareParser.js');
module.exports = {
	filterNegation: function(tag1, tag2, notvalue) {

		// negation  (  :not()  )
		var nattributes = {};
		var childindex;
		tag2.tag = tag2.tag ? tag2.tag : '*';
		if (notvalue.match(':first-child') || notvalue.match(':last-child')) {

			return _.find(tag1, function(code){
				childindex = notvalue.match(':first-child') ? 0 : code.children.length - 1;
				return (code.children[childindex].tag === tag2.tag  || tag2.tag === '*') && code.treenode + 1 == code.children[childindex].treenode ? true : false;
			})
		}
		else if (notvalue.match(':nth-child')) {
			var index = 0;
			var nthvalue = notvalue.match(/\((.*)\)/);
			var nthchild = nthvalue[1];
			return _.find(tag1, function(code){
				return _.find(code.children, function(tag){
					if(tag.tag === tag2.tag  || tag2.tag === '*')
						index++;

					return (code.treenode + 1 === tag.treenode && index >= parseInt(nthchild)) ? true : null;
				})

			})
		}
		else if (notvalue.slice(0, 1) === '.') {
			nattributes.classes = [];
			nattributes.classes.push(notvalue.split('.')[1]);
			var attributes = compareparser.formatAttributes(nattributes.classes,nattributes.ids);
			return _.find(tag1, function (code) {
				return _.find(code.children, function(tag){
					var matchfound = findmatch.getTagWithAttributes(tag.attributes, attributes);
					return matchfound && code.treenode + 1 == tag.treenode ? true : false;
				})
			})
		}
		else if (notvalue.slice(0, 1) === '#') {
			nattributes.ids = [];
			nattributes.ids.push(notvalue.split('#')[1]);
			var attributes = compareparser.formatAttributes(nattributes.classes,nattributes.ids);
			return _.find(tag1, function (code) {
				return _.find(code.children, function(tag){
					var matchfound = findmatch.getTagWithAttributes(tag.attributes, attributes);
					return matchfound && code.treenode + 1 == tag.treenode ? true : false;
				})
			})
		}else{
			return _.find(tag1, function (code) {
				var matchfound;
				var tagmatch = {};
				return _.find(code.children, function(tag){
					matchfound =  tag.tag == notvalue || tag2.tag === '*';
					if(matchfound)
						tagmatch.treenode = tag.treenode;
					return tagmatch && code.treenode + 1 == tagmatch.treenode ? true : false;

				})
			})
		}
		return false;
	},
	compareNegation: function(tag1, tag2, notvalue){
		// :not
		return this.filterNegation(tag1, tag2, notvalue) ? true : false;
	}
}

