var fs = require('fs');
var Q = require('q');
var _ = require('underscore');
var tagattributes = require('../lib/tagAttributes.js');

module.exports = {

	start: function(filename,code){
		var viewtag = {};
		viewtag.code = {};
		viewtag.dom = {};
        var tagsarray = code.match(/<(.*?)>/g);
        this.identifyTags(tagsarray);
	},
    identifyTags: function(tagsarray){
        _.each(tagsarray, function(tag){
            console.log(tag);
            if(tag != '</' + tag + '>'){

            }
        })

    }
}
