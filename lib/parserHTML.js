var _ = require('underscore');
var findselectors = require('../lib/compareFindSelectorTypes.js');
var cleancode = require('../lib/parserCleanCode.js');

module.exports = {
	start: function(filename,code){
		var self = this;
		var linenumber = 0;
		var treenode = 0;
		var allclasses = [];
		var allids = [];
		var allattributes = [];
		var viewtag = {};
		viewtag.code = {};
		viewtag.dom = {};
		var tagsarray = code.match(/<(.*?)>/g);

		/*  loop through each tag to identify
			attributes including class and id  */

		_.each(tagsarray, function(tag, key){
			var tagmatch = tag.match(/[^<.*]+(?=>)/g);
			var code = tagmatch[0].match(/([^\s"]+|"[^"]*")+/g);
			linenumber++;
			if(code[0].substr(0,1) != '/' || tagmatch[0].substr(-1) == '/'){
                treenode++;
                var attributes = self.getChildren(tagsarray,code[0],code,linenumber,treenode);
				if(attributes){

					/*  current tag's classes, ids, and other attributes
						are pushed to array  */

                    var attributesarray = attributes.attributes.match(/([^\s"]+|"[^"]*")+/g);
                    for(var i in attributes.classes){
                        allclasses.push(attributes.classes[i]);
                    }
                    for(var j in attributes.ids){
                        allids.push(attributes.ids[j]);
                    }
                    for(var k in attributesarray){
                        allattributes.push(attributesarray[k]);
                    }

                    /*  set properties that are specific
                     to the current tag in the loop */

                    viewtag.dom[key]= {};
                    viewtag.dom[key].tag = attributes.tag;
                    viewtag.dom[key].attributes = attributes.attributes;
                    viewtag.dom[key].children = attributes.children;
                    viewtag.dom[key].siblings = attributes.siblings;
                    viewtag.dom[key].tabindents = attributes.tabindents;

                    if(tagmatch[0].substr(-1) === '/')
                        treenode--;
				}
			}else
				treenode--;
		});

		viewtag.classes = allclasses;
		viewtag.ids = allids;
		viewtag.attributes = allattributes;
		viewtag.code.dom = viewtag.dom;
		return viewtag;

	},
	getChildren: function(tagsarray,tag,attributes,linenumber,treenode){
		var index = 0;
		var childrenarray = [];
		var siblingsarray = [];
		var tagname = tag;
		var closingtag = '/' + tag;
		var tagattributes = this.getAttributes(attributes).replace(/\//g,"");
		var classid = this.getClassesAndIds(attributes);

		for(var i in tagsarray){
			var innertag = tagsarray[i].match(/[^<]+(?=>)/g);

			var innertagname = innertag[0].split(' ');
			index++;

			if((closingtag == innertagname[0] && index > linenumber) || tag == innertagname[0] && innertag[0].substr(-1) == '/'){
				var code = {};
				code.classes = classid.classes;
				code.ids = classid.ids;
				code.tag = tagname;
				code.children = childrenarray;
				code.attributes = tagattributes;
				code.siblings = siblingsarray;
				code.tabindents = treenode;
				return code;
			}else if(innertagname[0].substr(0,1) != '/' && index >= linenumber){
					if(index == linenumber)
						siblingsarray.push(innertagname[0]);
					else
						childrenarray.push(innertagname[0]);
			}
		}
	},
	getAttributes: function(attributes){
		var allattrs = '';
		for(var i in attributes){
			if(i != 0)
				allattrs = allattrs ? allattrs + ' ' + attributes[i] : attributes[i];
		}
		return allattrs;
	},
	getClassesAndIds: function(attributes){
		var code = {};
		var classes;
		var classesarray = [];
		var ids;
		var idsarray = [];
		for(var i in attributes){
			if(attributes[i].match(/([a-z]+-)?ng-class([-a-z]+)?="+\{?(.*)\}?"+,?|([a-z]+:)?ng:class([:a-z]+)?="+\{?(.*)\}?"+,?/g)){
				var ngclassarray = findselectors.findNGClasses(attributes[i]);
				for(var j in ngclassarray){
					classesarray.push(ngclassarray[j]);
				}
				attributes[i].replace(/([a-z]+-)?ng-class([-a-z]+)?="+\{?(.*)\}?"+,?|([a-z]+:)?ng:class([:a-z]+)?="+\{?(.*)\}?"+,?/g,"")
			}
			else if(attributes[i].match(/class="(.*?)"/gm)){
				classes = findselectors.findClasses(attributes[i]);
				classesarray = classes.split(' ');
			}
			else if(attributes[i].match(/id="(.*?)"/gm)){
				ids = findselectors.findIds(attributes[i]);
				idsarray = ids.split(' ');
			}

		}
		classesarray = cleancode.removeEmpty(classesarray);
		idsarray = cleancode.removeEmpty(idsarray);

		code.classes = classesarray;
		code.ids = idsarray;
		return code;
	}
}
