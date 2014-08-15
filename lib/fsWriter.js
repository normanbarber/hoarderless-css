var fs = require('fs');
var Q = require('q');
module.exports = {
    services: {
        'rewriteFile': function(searchdirectory, selectors) {
            var self = this;
            var cssfile = selectors.css.code;
            cssfile.map(function (file) {
                var csscode = file.content.toString();
                var cleancode =  csscode.replace(/'/g,'"')
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
                                                if(type === 'classes')
                                                    pre = '.';
                                                if(type === 'ids')
                                                    pre = '#';
                                                if(type === 'tags' || type === 'attributes' || type === 'advance')
                                                    pre = '';

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

                            // if all selectors in this line are unused then comment the whole rule
                            // else comment the selectors in tha addcommentarray
                            if(addcommentarray.length >= selectorsplit.length){
                                var rewith = '/*' + cssrule[j] + '*/\n';
                                cleancode = cleancode.replace(cssrule[j], rewith);
                            }else{
                                comments = addcommentarray.join(',');
                                uncomments = nocommentarray.join(',');
                                if(comments){
                                    comments = '/*' + comments + ',*/\n';
                                    var commentsuncomments = comments + uncomments;
                                    cleancode = cleancode.replace(cssstr, commentsuncomments);
                                }

                            }

                        }else{

                            var pre;
                            for(var type in selectors.unused){
                                var unused = selectors.unused[type];
                                for(var v in unused){

                                    for(var x in unused[v].selector){
                                        if(type === 'classes')
                                            pre = '.';
                                        if(type === 'ids')
                                            pre = '#';
                                        if(type === 'tags' || type === 'attributes' || type === 'advance')
                                            pre = '';

                                        var cssselector = pre + unused[v].selector[x];

                                        if(cssstr.slice(0,1) == ' ')
                                            cssstr = cssstr.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                                        if(cssstr == cssselector){
                                            var rewith = '\n/*\n' + cssrule[j] + '\n*/\n';
                                            cleancode = cleancode.replace(rewith, cssrule[j]).replace(cssrule[j], rewith);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                var filename = file.name;
                self.writeNewFile(searchdirectory,filename,cleancode);
            });

            return Q(selectors.unused);
        },

        'writeNewFile': function(savedirectory,filename, css) {
            css = css.replace(/;/g, ';\n').replace(/\}/g, '}\n').replace(/\{/g, '{\n');
            savedirectory = savedirectory + '/' + '_hoarderless_' + filename;
            fs.writeFile(savedirectory, css, function (err) {
                if (err) throw err;
            });
        }
    }
};