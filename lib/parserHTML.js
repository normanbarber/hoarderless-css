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
		var isScript = false;
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
			if(isScript === true){
				if(code[0] === '/script')
					isScript = false;
			}

			if(code[0].substr(0,1) != '/'){
				treenode++;
				if(code[0] === 'script' || isScript === true  || (code[0] == 'script' && tagmatch[0].substr(-1) === '/')){
					isScript = true;
					linenumber--;
					var attrs = self.handleScript(code);
					if(attrs){
						for(var i in attrs.classes){
							classes.push(attrs.classes[i]);
						}
						for(var j in attrs.ids){
							ids.push(attrs.ids[j]);
						}
					}
					if(tagmatch[0].substr(-1) === '/'){
						treenode--;
						isScript = false;
					}


				}else{
					var attributes = self.getChildren(tagsarray,code[0],code,linenumber,treenode);
					if(attributes){

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


					}
					if(tagmatch[0].substr(-1) === '/')
						treenode--;
				}

			}else{
				if(code[0] === '/script' || code[0] === 'script')
					linenumber--;

				treenode--;
			}

		});

        /*  push all classes ids and attriubtes to their  */

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
		var isScript = false;
		var siblingsdone = false;

		_.each(tagsarray, function(looptag){
			var innertag = looptag.match(/[^<.*][^>"]*(?:"[^"]*"[^>"]*)*(?=>)/g);
			var innertagname = innertag[0].split(' ');

			loopline++;
			if(isScript === true || innertagname[0] === 'script'){
				isScript = true;
				loopline--;
			}

			if(innertagname[0].substr(0,1) != '/')
				loopnode++;

			if(loopline >= linenumber && !isScript){

				if((!code && loopnode === treenode) && (closingtag == innertagname[0]) ||  tag == innertagname[0] && innertag[0].substr(-1) == '/'){
					parenttagclosed = true;
					isScript = false;
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
						if(loopnode < treenode)
							siblingsdone = true;
						if(loopnode == treenode && !siblingsdone)
							siblingsarray.push(innertagname[0]);
						else if(loopnode > treenode && !parenttagclosed)
							childrenarray.push(innertagname[0]);
					}
				}
			}

			if((innertagname[0].substr(0,1) == '/'  || innertag[0].substr(-1) === '/'))
				loopnode--;

			if(innertagname[0] === '/script' || (innertagname[0] == 'script' && innertag[0].substr(-1) === '/')){
				isScript = false;
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
	},
	handleScript: function(code){
		var attributes;
		for(var i in code){
			if(code[i].match(/class="(.*?)"/gm) || code[i].match(/id="(.*?)"/gm)){
				attributes = this.getClassesAndIds(code);
			}
		}
		return attributes;

	}
}