var comparecomplex = require('../lib/compareComplex.js');
module.exports = {
	getClasses: function(css_classes,view_classes){
		var xtracss_classes = {};
		var usedclasses = [];
		for(var i in css_classes){
			xtracss_classes[i] = {};

			var classarray = css_classes[i];
			var xtracss_classes_tmp = [];
			for(var j in classarray.selector){

				for(var k in view_classes){

					var viewfile = view_classes[k];
					for(var m in viewfile){
						if(viewfile[m] === classarray.selector[j]){
							usedclasses.push(classarray.selector[j]);
						}

					}
				}
				if(usedclasses.indexOf(classarray.selector[j]) === -1 && xtracss_classes_tmp.indexOf(classarray.selector[j]) === -1){
					xtracss_classes_tmp.push(classarray.selector[j]);
				}
			}
			xtracss_classes[i].filename = classarray.filename;
			xtracss_classes[i].selector = xtracss_classes_tmp;
		}
		return xtracss_classes;
	},
	getIds: function(css_ids,view_ids){
		var xtracss_ids = {};
		var usedids = [];
		for(var i in css_ids){
			xtracss_ids[i] = {};
			var idsarray = css_ids[i];
			var xtracss_ids_tmp = [];
			for(var j in idsarray.selector){
				for(var k in view_ids){

					var viewfile = view_ids[k];
					for(var m in viewfile){
						if(viewfile[m] === idsarray.selector[j]){
							usedids.push(idsarray.selector[j]);
						}
					}
				}
				if(usedids.indexOf(idsarray.selector[j]) === -1 && xtracss_ids_tmp.indexOf(idsarray.selector[j]) === -1){
					xtracss_ids_tmp.push(idsarray.selector[j]);
				}

			}
			xtracss_ids[i].filename = idsarray.filename;
			xtracss_ids[i].selector = xtracss_ids_tmp;
		}
		return xtracss_ids;
	},
	getAttributes: function(view_code,css_attributes,view_attributes){
		var xtracss_attributes = {};
		var viewcode = JSON.parse(view_code);

		for(var i in css_attributes){
			xtracss_attributes[i] = {};
			var attributesarray = css_attributes[i];
			var xtracss_attributes_tmp = [];


			for(var j in attributesarray.selector){
				var selector = attributesarray.selector[j];
				var attributevalue = selector.match(/\[.*?\]/g);
				tag = selector.replace(/\[.*?\]/g,"");
				var attributefound = comparecomplex.compare_attributes(viewcode, tag, attributevalue);
				if(view_attributes.indexOf(attributesarray.selector[j]) === -1 && !attributefound)
					xtracss_attributes_tmp.push(selector);

			}

			xtracss_attributes[i].filename = attributesarray.filename;
			xtracss_attributes[i].selector = xtracss_attributes_tmp;
		}
		return xtracss_attributes;
	},
	getTags: function(css_tags,selectors){
		var xtracss_tags = {};
		var viewfiles = selectors.view.selectors.viewcode;

		for(var i in css_tags){
			xtracss_tags[i] = {};
			var tagsarray = css_tags[i];
			var tag = this.compareTags(viewfiles,tagsarray.selector);

			if(tag){
				xtracss_tags[i].filename = tagsarray.filename;
				xtracss_tags[i].selector = tag;
			}

		}
		return xtracss_tags;
	},
	compareTags: function(viewfiles,csstags){
		var unusedtags=[];
		for(var i in csstags){
			var usedinview = false;
			for(var j in viewfiles){
				var viewcode = viewfiles[j].dom;
				for(var k in viewcode){
					if(viewcode[k].tag === csstags[i]){
						usedinview=true;
					}
				}
			}
			if(!usedinview && unusedtags.indexOf(csstags[i]) === -1)
				unusedtags.push(csstags[i]);
		}
		return unusedtags;
	}
}

