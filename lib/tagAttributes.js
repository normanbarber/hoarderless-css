var Q = require('q');
var _ = require('underscore');

module.exports = {

	getTagAttributes: function(classarray,idsarray,data_attributes_array){

		var classstr = '';
		for(var c in classarray){
			classstr = classstr + ' ' + classarray[c];
		}
		var idstr = '';
		for(var i in idsarray){
			idstr = idstr + ' ' + idsarray[i];
		}

		var idattributes;
		if(idstr)
			idattributes = 'id="' + idstr + '"';
		else
			idattributes = null;

		var classattributes;
		if(classstr)
			classattributes = 'class="' + classstr + '"';
		else
			classattributes = null;

		var allattributes =  (classattributes ? classattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + (classattributes && idattributes ? ' ' : '')
			+ (idattributes ? idattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + ((data_attributes_array.length > 0) && (classattributes || idattributes) ? ' ' : '')
			+ (data_attributes_array ? data_attributes_array : '');

		return allattributes;
	},
	getTagName: function(tag){
		var tagname = tag;
		if(tagname.match(/\./g) || tagname.match(/\#/g)){
			if(tagname.match(/\#/g)){
				tagname = tagname.replace(/\#.+/g,"");
			}
			if(tagname.match(/\./g))
				tagname = tagname.replace(/\..+/g,"");

		}
		return tagname;
	},
	getTagChildren: function(codearray,current_tag_index,current_tab_indents){

		// current_tag_index - index of the array for the html tag you are passing in
		// current_tab_indents - number of tab indents the tag has in the jade file. use this to help find the tags children

		var children_array = [];
		var current_tag_closed=false;
		for(var i in codearray){
			var code_array = codearray[i].split('\t');
			var code_tab_indents = code_array.length;
			if(code_tab_indents <= current_tab_indents && current_tag_closed === true){

				return children_array;
			}
			else if(parseInt(i) >= parseInt(current_tag_index) && (code_tab_indents == current_tab_indents + 1)){
				current_tag_closed = true;

				var tagname = code_array[code_tab_indents - 1];
				tagname = tagname.match(/[^\A](.*?)(?=\.)|([^\s]+)/g);
				if(tagname[0].match(/[^\A](.*?)(?=\#)|([^\s]+)/g)){
					tagname = tagname[0].match(/[^\A](.*?)(?=\#)|([^\s]+)/g)
				}
				if(tagname[0].match(/[^\A](.*?)(?=\()|([^\s]+)/g)){
					tagname = tagname[0].match(/[^\A](.*?)(?=\()|([^\s]+)/g)
				}
				tagname[0] = tagname[0].replace(/\:/g,"");
				children_array.push(tagname[0]);
			}
			else if(parseInt(i) == parseInt(current_tag_index)){
				current_tag_closed = true;
			}
		}
		return children_array;
	},
	getTagSiblings: function(codearray,current_tag_index,current_tab_indents){

		var sibling_array = [];
		var current_tag_closed=false;
		for(var i in codearray){

			var code_array = codearray[i].split('\t');
			var code_tab_indents = code_array.length;
			if(current_tag_closed === true){
				return sibling_array;
			}
			else if(parseInt(i) > parseInt(current_tag_index)){
				if(code_tab_indents < current_tab_indents){
					current_tag_closed = true;
				}
				if(code_tab_indents == current_tab_indents){
					var tagname = code_array[code_tab_indents - 1];
					tagname = tagname.match(/[^\A](.*?)(?=\.)|([^\s]+)/g);
					if(tagname[0].match(/[^\A](.*?)(?=\#)|([^\s]+)/g)){
						tagname = tagname[0].match(/[^\A](.*?)(?=\#)|([^\s]+)/g)
					}
					if(tagname[0].match(/[^\A](.*?)(?=\()|([^\s]+)/g)){
						tagname = tagname[0].match(/[^\A](.*?)(?=\()|([^\s]+)/g)
					}

					sibling_array.push(tagname[0]);
				}
			}
		}
		return sibling_array;
	}

};
