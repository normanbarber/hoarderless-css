module.exports = {
	cleanHTML: function(code){
		var cleancode = code.replace(/'/g,'"')
			.replace(/\s*=\s*/g,'=')
			.replace(/\s*-\s*/g,'-')
			.replace(/\s*"/g,'"')
			.replace(/\s+/g,' ')
			.replace(/="\s{1,}/g,'="')
			.replace(/\s*<\s*/g,'<')
			.replace(/<\s*\/\s*/g,'</')
			.replace(/\r\n\s*/g,'');

		return cleancode;
	},
	cleanCSS: function(code){
		var cleancode = code.replace(/'/g,'"')
			.replace(/(\\r\\n\\t|\\n|\\r|\\t|\\)/gm,"")
			.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)|"/gm,"")
			.replace(/\s*>\s*/g," > ")
			.replace(/\s*~\s*/g," ~ ")
			.replace(/\s*\+\s*/g," + ")
			.replace(/,\s+/g,",")
			.replace(/\s+,/g,",")
			.replace(/\s*=\s*/g,"=")
			.replace(/\s*\]/g,"]")
			.replace(/\[\s*/g,"[")
			.replace(/\s\s+/g," ")
			.replace(/\s+\{/g,"{");
		return cleancode;
	},
	removeEmpty: function(array){
		return array.filter(function(m){return m !== ''});
	},
	addPadding: function(code){
		return code + '\r\n\r\n';
	}
};
