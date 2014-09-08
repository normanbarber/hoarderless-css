var comparecomplex = require('../lib/compareComplex.js');
module.exports = {
	matchTags: function(viewfiles,tag,operator){
		var view_code_obj = [];
		var child_array_index=1;

		for(var i in viewfiles){
			view_code_obj[i] = {};
			view_code_obj[i].filename = viewfiles[i].filename;
			var viewcode = viewfiles[i].dom;
			var view_code_array = [];
			var childarray = [];
			var siblingsarray = [];
			var matchfound = false;
			for(var j in viewcode){

				if(tag.selectors){
					if(viewcode[j].tabindents < tag.tabindents){
						matchfound = false;
					}
					var siblings_array_index=1;

					if(!matchfound){
						matchfound = comparecomplex.matchViewTagByAttributes(viewcode[j].attributes,tag.selectors);
					}

					if(matchfound || childarray.indexOf(viewcode[j].tag) >= 0 || siblingsarray.indexOf(viewcode[j].tag) >= 0){
						var siblings = viewcode[j].siblings;
						for(var k in siblings){
							siblingsarray.push(siblings[k]);
						}

						var children = viewcode[j].children;
						for(var k in children){
							childarray.push(children[k]);
						}

						if(childarray.indexOf(viewcode[j].tag) >= 0 && child_array_index <= childarray.length){
							if(viewcode[j].tabindents > tag.tabindents){
								child_array_index++;
								var children = viewcode[j].children;
								for(var k in children){
									childarray.push(children[k]);
								}
							}
						}
						if(siblingsarray.indexOf(viewcode[j].tag) >= 0 && siblings_array_index <= siblingsarray.length && (operator === '~' || operator === '+')){
							if(viewcode[j].tabindents > tag.tabindents){
								siblings_array_index++;
								var siblings = viewcode[j].siblings;
								for(var k in siblings){
									siblingsarray.push(siblings[k]);
								}
							}
						}
						if(matchfound && viewcode[j].tabindents >= tag.tabindents){
							view_code_array.push(viewcode[j]);
						}
						else if(operator && operator.match(/\+|\~/)){
							view_code_array.push(viewcode[j]);
						}
					}
				}else if(!tag.selectors){
					if(tag.tag == viewcode[j].tag || (childarray.indexOf(viewcode[j].tag) >= 0 || siblingsarray.indexOf(viewcode[j].tag) >= 0)){
						view_code_array.push(viewcode[j]);
						var children = viewcode[j].children;
						for(var k in children){
							childarray.push(children[k]);
						}
						var siblings = viewcode[j].siblings;
						for(var k in siblings){
							siblingsarray.push(siblings[k]);
						}

					}
				}
			}
			view_code_obj[i].dom = view_code_array;
		}
		for(var m in view_code_obj){
			if(view_code_obj[m].dom.length > 0){
				view_code_obj = JSON.stringify(view_code_obj);
				return view_code_obj;
			}
		}
		return false;

	}
}

