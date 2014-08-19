var Q = require('q');
var _ = require('underscore');

module.exports = {

	init: function(codearray){

		var appendline = false;
		var appendarray = [];
		var lineindex = 1;
		var jadeline;


		// add an extra line for padding at end of file
		var code = codearray[codearray.length - 1].split('\t');
		if(code[code.length - 1])
			codearray.push('\t\t')

		for(var i in codearray) {

			var tabcountarray;
			var tabcount;
			var tabindex
			if(codearray[i].slice(-1) == ','){
				if(lineindex === 1){
					tabcountarray = codearray[i].split('\t');
					tabcount = tabcountarray.filter(function(m){return m == ''});
					tabindex = tabcount.length-1;
				}
				appendarray.push(codearray[i].replace(/\t/g,""));
				appendline = true;
				lineindex++;
			}

			if(codearray[i].slice(-1) == ')' && appendline == true){
				appendline = false;
				for(var n in appendarray){
					jadeline = jadeline ? jadeline + appendarray[n] : appendarray[n];
				}

				var tabs = '\t';
				for(var k=1; k <= tabindex; k++){
					tabs = tabs + '\t';
				}
				var singleline = tabs + jadeline;
				codearray.splice((parseInt(i)+1)-lineindex,lineindex,singleline);
				appendarray = [];
				lineindex=1;
			}

		}

		for(var i in codearray) {
			codearray[i] = codearray[i].replace(/([a-z]+-)?ng-class="{(.*?)}",?|([a-z]+-)?ng-class="(.*?)",?|ng:class="{(.*?)}",?|ng:class="(.*?)",?/g,"");
			if(codearray[i].match(/\:/g)){

				var tabcountarray = codearray[i].split('\t');
				var tabcount = tabcountarray.filter(function(m){return m == ''});
				codearray[i] = codearray[i].replace(/\:/g," : ").replace(/\s(?![^)]*(\(|$))|\s(?![^}]*(\{|$))/g, "<~>");

				var codearraysplit = codearray[i].split(' : ');
				var tabindex=tabcount.length;

				codearray.splice(i,1,codearraysplit[0]);
				for(var j=1; j < codearraysplit.length; j++){
					var newstr=codearraysplit[j];
					newstr = newstr.replace(/\s*/g,"");
					// conditional if a string/tag exists
					if(newstr){
						var tabs = '\t';
						for(var k=1; k <= tabindex; k++){
							tabs = tabs + '\t';
						}
						newstr = tabs + newstr;
						codearray.splice(parseInt(i)+parseInt(j),0,newstr);
						tabindex++;
					}
				}
			}
		}
        return codearray;
	},
	removeIrrelevant:function(codearray){
		var code_cleaned = [];
		for(var i in codearray){

			codearray[i] = codearray[i].replace(/\s*#{__(.*?)}|\s*{{(.*?)}}|href="(.*?)",|href="(.*?)"|src="(.*?),"|src="(.*?)"|#{(.*?)}|\(\)/g,""); // cleaning up interpolation and other view vars. there may be a better place to do this
			if(codearray[i].match(/\s\s\s\s/) && !codearray[i].match(/\t/g))
				codearray[i] = codearray[i].replace(/\s\s\s\s/g,"\t");
			var tabreplace = codearray[i].replace(/\t*/g,"");
			if(!tabreplace.slice(0,6).match(/\/\/|\/\*/)){
				if(tabreplace.slice(0,7).match(/include\\b/) || tabreplace.slice(0,6).match(/includ|block\\b|extend\\b|return\\b/) || tabreplace.slice(0,5).match(/while\\b/) || tabreplace.slice(0,4).match(/meta\\b|html\\b|link\\b|base\\b|each\\b/) || tabreplace.slice(0,1).match(/\-|\"|\'|\|\{|\}|\$/) || tabreplace.slice(0,3).match(/if \\b|do \\b|var\\b|for\\b|!!!\\b/)){
				}else if(codearray[i]){
					code_cleaned.push(codearray[i]);
				}

			}
		}
		return Q(code_cleaned);
	}
};
