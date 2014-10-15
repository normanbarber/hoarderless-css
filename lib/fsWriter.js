var fs = require('fs');
var Q = require('q');
var codecleaner = require('../lib/parserCleanCode.js');
module.exports = {
	services: {

		/*  called from lib/codeWriterMain.js
			loops css code and compares css with the
			unused selectors object that was created in step3.
			when it finds a match it comments the css rule
			finally writing new commented css files */

		'rewriteFile': function(searchdirectory, selectors) {
			var self = this;
			var cssfile = selectors.css.code;
			cssfile.map(function (file) {
				var csscode = file.content.toString();
				var cleancode = codecleaner.cleanCSS(csscode);
				var cssrule = cleancode.match(/[^}]+[?=\}]/g);
				var addcommentarray;
				var nocommentarray;
				var noncompareSelectors;
				var matchselector;
				var comments;
				var uncomments;
				for(var j in cssrule){
					var cssstr;
					var cssselector = cssrule[j].match(/.+(?=\{)/g);
					cssrule[j] = cssrule[j].replace(/\[/g, '\\[').replace(/\]/g, '\\]');
					if(cssselector){
						cssstr = cssselector.toString();
						cssstr = cssstr.replace(/,\s+/g,",").replace(/^\s\s*/, '').replace(/\s\s*$/, '');
					}
					addcommentarray = [];
					nocommentarray = [];
					noncompareSelectors = cssstr.match(/@|%/g);
					if(!noncompareSelectors){
						var selectorsplit = cssstr.split(',');

						if(selectorsplit.length > 1){

							for(var m in selectorsplit){

								var pre;
								for(var type in selectors.unused){
									var unused = selectors.unused[type];
									for(var v in unused){

										if(selectorsplit[m]){
											var selector = selectorsplit[m];

											for(var x in unused[v].selector){
												pre = self.formatCSSSelector(type);
												var matchingselector = pre + unused[v].selector[x];
												if(selector == matchingselector && addcommentarray.length <= selectorsplit.length){
													addcommentarray.push(selector);
												}
											}
										}
									}
								}
							}
							for(var c in selectorsplit){
								if(selectorsplit[c].slice(0,1).match(' '))
									matchselector = selectorsplit[c].replace(/\s/,"");
								else
									matchselector = selectorsplit[c];

								if(addcommentarray.indexOf(matchselector) === -1){
									nocommentarray.push(matchselector);
								}
							}
							if(addcommentarray.length >= selectorsplit.length){
								var rewith = '/*' + cssrule[j] + '*/\n';
								if(cleancode.indexOf(rewith) === -1)
									cleancode = cleancode.replace(new RegExp(cssrule[j], 'g'), rewith);
							}else{
								comments = addcommentarray.join(',');
								uncomments = nocommentarray.join(',');
								if(comments){
									comments = '/*' + comments + ',*/\n';
									var commentsuncomments = comments + uncomments;
									if(cleancode.indexOf(commentsuncomments) === -1)
										cleancode = cleancode.replace(new RegExp(cssstr, 'g'), commentsuncomments);
								}
							}
						}else{
							var pre;

							for(var type in selectors.unused){
								var unused = selectors.unused[type];
								for(var v in unused){
									for(var x in unused[v].selector){
										pre = self.formatCSSSelector(type);

										var cssselector = pre + unused[v].selector[x];
										if(cssstr.slice(0,1) == ' ')
											cssstr = cssstr.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

										if(cssstr == cssselector){
											var rewith = '\n/*\n' + cssrule[j] + '\n*/\n';
											if(cleancode.indexOf(rewith) === -1){
												if(cssselector.match(/nth-child|not(.*)/g))
													cleancode = cleancode.replace(cssrule[j], rewith);
												else
													cleancode = cleancode.replace(new RegExp(cssrule[j], 'g'), rewith);
											}
										}
									}
								}
							}
						}
					}
				}
				cleancode = cleancode.replace(/\\/g,"");
				var filename = file.name;
				self.writeNewFile(searchdirectory,filename,cleancode);
			});
			return Q(selectors.unused);
		},
		'writeNewFile': function(savedirectory,filename, css) {
			css = css.replace(/;/g, ';\n').replace(/\}/g, '}\n').replace(/\{/g, '{\n');
            savedirectory = savedirectory + '/' + 'hoarderless';
            fs.mkdir(savedirectory);
            savedirectory = savedirectory + '/'  + filename;
			fs.writeFile(savedirectory, css, function (err) {
				if (err) throw err;
			});
		},
		'formatCSSSelector': function(type){
			if(type === 'classes')
				pre = '.';
			if(type === 'ids')
				pre = '#';
			if(type === 'tags' || type === 'attributes' || type === 'advanced')
				pre = '';

			return pre;
		}
	}
};
