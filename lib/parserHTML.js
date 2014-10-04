var _ = require('underscore');
var findselectors = require('../lib/compareFindSelectorTypes.js');
var cleancode = require('../lib/parserCleanCode.js');
var Q = require('q');

module.exports = {
	start: function(filename,code,viewtag){

		/*  loop through each tag to identify
		 attributes including class and id  */

		var self = this;
		var linenumber = 0;
		var treenode = 0;
		var classes = [];
		var ids = [];
		var allattributes = [];
		var view = {};
		view.dom = {};

		var tagsarray = code.match(/<[^>"]*(?:"[^"]*"[^>"]*)*>/g);
		_.each(tagsarray, function(tag, key){
			var tagmatch = tag.match(/[^<.*][^>"]*(?:"[^"]*"[^>"]*)*(?=>)/g);
			var code = tagmatch[0].match(/([^\s"]+|"[^"]*")+/g);
			linenumber++;

			if(code[0].substr(0,1) != '/' || tagmatch[0].substr(-1) == '/'){

				var attributes = self.getChildren(tagsarray,code[0],code,linenumber,treenode);
				if(attributes){

					treenode++;

					/*  current tag's classes, ids, and other attributes
					 are pushed to array  */

					var attributesarray = attributes.attributes.match(/([^\s"]+|"[^"]*")+/g);
					for(var i in attributes.classes){
						classes.push(attributes.classes[i]);
					}
					for(var j in attributes.ids){
						ids.push(attributes.ids[j]);
					}
					for(var k in attributesarray){
						allattributes.push(attributesarray[k]);
					}

					/*  set properties that are specific
					 to the current tag in the loop */

					view.dom[key]= {};
					view.dom[key].tag = attributes.tag;
					view.dom[key].attributes = attributes.attributes;
					view.dom[key].children = attributes.children;
					view.dom[key].siblings = attributes.siblings;
					view.dom[key].tabindents = attributes.tabindents;

					if(tagmatch[0].substr(-1) === '/')
						treenode--;
				}
			}else
				treenode--;
		});

		view.filename = filename;
		viewtag.classes.push(classes);
		viewtag.ids.push(ids);
		viewtag.attributes.push(allattributes);
		viewtag.viewcode.push(view);

		return Q(viewtag);

	},
	getChildren: function(tagsarray,tag,attributes,linenumber,treenode){

		/*  input: one tag
		 return: the tags name, its children, siblings, classes, ids and where its located in the dom tree  */

		var loopnode = 0;
		var loopline = 0;
		var childrenarray = [];
		var siblingsarray = [];
		var tagname = tag;
		var closingtag = '/' + tag;
		var parenttagclosed = false;
		var tagattributes = this.getAttributes(attributes).replace(/\//g,"");
		var classid = this.getClassesAndIds(attributes);
		var code = null;

		_.each(tagsarray, function(looptag){

			loopline++;
			var innertag = looptag.match(/[^<.*][^>"]*(?:"[^"]*"[^>"]*)*(?=>)/g);
			var innertagname = innertag[0].split(' ');

			if(parenttagclosed && loopnode < treenode)
				return code;

			/*

			 first check if the linenumber in the loop is >= the linenumber of the tag we are matching
			 if so and the closingtag has not been reached yet (!code)
			 and its the matching close tag ( closingtag == innertagname[0] )
			 or its a self closing tag ( innertag[0].substr(-1) == '/' )

			 */

			if(loopline >= linenumber){
				if((!code && loopnode >= treenode) && (closingtag == innertagname[0]) ||  tag == innertagname[0] && innertag[0].substr(-1) == '/'){
					parenttagclosed = true;
					code = {};
					code.classes = classid.classes;
					code.ids = classid.ids;
					code.tag = tagname;
					code.children = childrenarray;
					code.attributes = tagattributes;
					code.siblings = siblingsarray;
					code.tabindents = treenode;
				}else if(innertagname[0].substr(0,1) != '/'){
					if(loopline > linenumber){
						if(loopnode == treenode)
							siblingsarray.push(innertagname[0]);
						else if(loopnode > treenode && !parenttagclosed)
							childrenarray.push(innertagname[0]);
					}
				}
			}

			/*

			 decrease the treenode number is its a closing tag or self closing tag
			 or inc if its a new tag

			 */

			if(innertagname[0].substr(0,1) == '/' || innertag[0].substr(-1) == '/'){
				loopnode--;
			}else{
				loopnode++;
			}
		});

		return code;
	},
	getAttributes: function(attributes){

		/*
		 input: tag with attributes
		 return attributes ie class="someclass" id="someid" data-type="sometype"

		 */

		var tagattributes = '';
		for(var i in attributes){
			if(i != 0)
				tagattributes = tagattributes ? tagattributes + ' ' + attributes[i] : attributes[i];
		}
		tagattributes = tagattributes.replace(/([a-z]+-)?ng-class([-a-z]+)?="+\{?(.*)\}?"+,?|([a-z]+:)?ng:class([:a-z]+)?="+\{?(.*)\}?"+,?/gi,"")
		return tagattributes;
	},
	getClassesAndIds: function(attributes){

		/*
		 input: tag with attributes
		 return object with 2 properties, obj.classes and obj.ids
		 obj.classes is an array of all classes found in a file
		 obj.ids is an array of all ids found in a file

		 */

		var code = {};
		var classes;
		var classesarray = [];
		var ids;
		var idsarray = [];
		for(var i in attributes){
			if(attributes[i].match(/([a-z]+-)?ng-class([-a-z]+)?="+\{?(.*)\}?"+,?|([a-z]+:)?ng:class([:a-z]+)?="+\{?(.*)\}?"+,?/gi)){
				var ngclassarray = findselectors.findNGClasses(attributes[i]);
				for(var j in ngclassarray){
					classesarray.push(ngclassarray[j]);
				}
			}
			else if(attributes[i].match(/class="(.*?)"/gi)){
				classes = findselectors.findClasses(attributes[i]);
				classesarray = classes.split(' ');
			}
			else if(attributes[i].match(/id="(.*?)"/gi)){
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