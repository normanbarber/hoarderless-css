var _ = require('underscore');
var findselectors = require('../lib/compareFindSelectorTypes.js');
var findmatch = require('../lib/compareFindMatch.js');
module.exports = {

	/*  comparing object created from html file read
	 with object created from css file read  */

	cssParser: function(viewdom,selector){

		/*  reading the css selector
		 identifying all classes and ids chained together
		 then compares the css selector with each tag in the html object
		 if its not found in the html it returns false  */

		var self = this;
		var tag = {};
		var attributesformat;
		var classarray=[];
		var idsarray=[];
		var pseudo;
		var attribute_array;
		if(selector && selector.match(/:[a-zA-Z-]+/)){
			if(selector && selector.match(/:[a-zA-Z-]+/) == ':nth-child' || selector.match(/:[a-zA-Z-]+/) == ':first-child' || selector.match(/:[a-zA-Z-]+/) == ':last-child' || selector.match(/:[a-zA-Z-]+/) == ':not'){
				pseudo = selector.match(/:.*/)[0];
			}
			selector = selector.replace(/\(.*?\)+/g,"").replace(/:[a-zA-Z-]+/g,"");
		}
		if(selector && selector.match(/\[(.*?)(?=\])/g)){
			pseudo = pseudo ? pseudo : selector.match(/\[(.*?)\]/)[0];
			selector = selector.replace(/\[.*\]/g,"");
			attributesformat = null;
		}

		classarray = selector.match(/\.[a-zA-Z-0-9_]+[^.#\[]?/g);
		idsarray = selector.match(/\#[a-zA-Z-0-9_]+[^.#\[]?/g);

		classarray = _.map(classarray, function(classes){
			return classes.substr(1)
		})
		idsarray = _.map(idsarray, function(ids){
			return ids.substr(1)
		})

		if(pseudo && pseudo.match(/class="(.*?)"/gm)){
			var attribute_classes = findselectors.findClasses(pseudo);
			attributesformat = null;
			attribute_array = attribute_classes.split(' ');
			_.each(attribute_array, function(attr){
				classarray.push(attr);
			})
		}
		else if(pseudo && pseudo.match(/id="(.*?)"/gm)){
			var attribute_ids = findselectors.findIds(pseudo);
			attributesformat = null;
			attribute_array = attribute_ids.split(' ');
			_.each(attribute_array, function(attr){
				idsarray.push(attr);
			})
		}

		viewdom = JSON.parse(viewdom);
		if(selector.match(/^[a-zA-Z-0-9_]+[^a-zA-Z-0-9_]/g))
			tag.tag = selector.match(/^[a-zA-Z-0-9_]+[^a-zA-Z-0-9_]/g)[0].slice(0,-1);
		else if(selector.match(/^[a-zA-Z-0-9_]+$/))
			tag.tag = selector.match(/^[a-zA-Z-0-9_]+$/)[0];
		else
			tag.tag = null;

		tag.attributes = !attributesformat ?  this.formatAttributes(classarray,idsarray) : attributesformat;
		return tag;
	},
	getTags:  function(viewdom,tag1){
		var self = this;
		viewdom = JSON.parse(viewdom);

		var tags=[];
		_.each(viewdom, function(dom){

			tags.push(_.filter(dom.dom, function(tag){
				if(tag1.attributes && (tag.tag === tag1.tag || tag1.tag=== null) && findmatch.getTagWithAttributes(tag.attributes,tag1.attributes))
					return tag;
				else if(!tag1.attributes && tag.tag === tag1.tag){
					return self.findViewTagMatch(tag.tag, viewdom)
				}
			}))
		})
		var tagsarray = [];
		for(var i in tags){
			var innertagarray = tags[i];
			for(var j in innertagarray){
				tagsarray.push(innertagarray[j])
			}
		}
		if(!tags)
			return false;

		return tagsarray;
	},
	formatAttributes: function(classarray,idsarray){
		/*  input: */
		/*  classarray: array ( an array of classes ) [ .classone, .classtwo ] */
		/*  idsarray: array ( an array of ids ) [ #idone ] */

		/*  out:  returns a string of attributes  class="classone classtwo" id="idone"  */

		var classstr = '';
		var idstr = '';
		var idattributes;
		var classattributes;
		var attributesformat;

		for(var c in classarray){
			classstr = classstr + ' ' + classarray[c];
		}

		for(var i in idsarray){
			idstr = idstr + ' ' + idsarray[i];
		}

		idattributes = idstr ? 'id="' + idstr + '"' : null;
		classattributes = classstr ? 'class="' + classstr + '"' : null;

		attributesformat =  (classattributes ? classattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + (classattributes && idattributes ? ' ' : '')
			+ (idattributes ? idattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + (classattributes || idattributes ? ' ' : '');

		attributesformat = attributesformat.replace(/\s+"/g, '"').replace(/"\s+/g, '"')
		return attributesformat;
	},
	findViewTagMatch: function(tag,viewcode){
		/*  input: */
		/*  tag: object  */
		/*  viewcode: string ( code from the view files ) */

		/*  out:  returns false if match not found in viewcode returns object of the tag if match was found */
		for(var i in viewcode){
			var tags = viewcode[i].dom;
			for(var j in tags){
				if(tag === tags[j].tag){
					return tags[j];
				}
			}
		}
		return false;
	}
}

