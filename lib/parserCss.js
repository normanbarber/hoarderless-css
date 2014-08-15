var fs = require('fs');
var Q = require('q');
var _ = require('underscore');

module.exports = {

    start: function(filename,cssrule){
        var complex_array = [];
        var attributes_array = [];
        var allclasses = [];
        var allids = [];
        var alltags = [];
        var css = {};
        for(var i in cssrule){
            var css3Check = cssrule[i].match(/@|%|from\b|to\b/g);
            if(!css3Check){
                var selectorsplit = cssrule[i].split(',');
                for(var s=0; s < selectorsplit.length; s++){
                    var cleanedcode = selectorsplit[s].replace(/\s{2,} /g,""); 
                    this.identifySelectorProperties(cleanedcode,selectorsplit[s],complex_array,attributes_array,allclasses,allids,alltags);
                }
            }
        }

        css.classes = allclasses;
        css.ids = allids;
        css.tags = alltags;
        css.complexarray = complex_array;
        css.attributesarray = attributes_array;

        return css;
    },
    identifySelectorProperties: function(cleanedcode,selector,complex_array,attributes_array,allclasses,allids,alltags){
        var regex_complex_operators =  />|\+|~|\s*\:\s*first-child|\s*\:\s*nth-child|\s*\:\s*last-child|\s*\:\s*not/g;
        var regex_attribute_selectors =  /\[(.*?)(?=\])/g;
        var regex_pseudo_selectors =  /(.*?)(?=\:[a-z])/g;
        var complex_selectors = selector.match(regex_complex_operators);
        var attribute_selectors = selector.match(regex_attribute_selectors);
        var pseudo_selectors = selector.match(regex_pseudo_selectors);

        if(selector.slice(0,1) === '*')
            return;

        var nthchild = selector.match(/\s*\:\s*first-child|\s*\:\s*nth-child|\s*\:\s*last-child|\s*\:\s*not/g);
        if(nthchild)
            selector =  selector.replace(/\s*:\s*/g,":");

        selector =  selector.replace(/\s{2,}/g," ").replace(/^\s+|\s+$/g,'');
        if(complex_selectors)
            return complex_array.push(selector);

        var multiselector = selector.split(' ');
        var multiselectorarray = multiselector.filter(function(m){return m !== ''});  // this cleans up arrays that have empty string values like, 	[ ' ', 'dannyfairy' ] will return [ 'dannyfairy' ]

        cleanedcode = cleanedcode.replace(/^\s+|\s+$/g,'');
        var chainedclasses = cleanedcode.split('.');  // this line will split all complex class selectors - need this to find selectors like  .classone.classtwo
        var chainedids = cleanedcode.split('#');
        chainedclasses = chainedclasses.filter(function(m){return m !== ''});
        chainedids = chainedids.filter(function(m){return m !== ''});

        // handle selectors chained together like .classone.classtwo or #idone#idtwo#idthree
        if(chainedclasses.length >= 2 || chainedids.length >= 2)
            return complex_array.push(selector);

        // handle multiple child selectors like h1 h2 or ul li
        if(multiselectorarray.length >= 2)
            return complex_array.push(selector);

        // handle attribute selectors
        if(attribute_selectors)
            return attributes_array.push(selector);

        if(cleanedcode.slice(0,1) === '.'){
            var classes = cleanedcode.replace(/\.|"|\s*/g,"");
            return allclasses.push(classes);
        }
        if(cleanedcode.slice(0,1) === '#'){
            var ids = cleanedcode.replace(/\#|"|\s*/g,"");
            return allids.push(ids);
        }
        if(pseudo_selectors && !nthchild){
            for(var i in pseudo_selectors){
                pseudo_selectors[i] = pseudo_selectors[i].replace(/\:/g,"");
                if(pseudo_selectors[i])
                    return alltags.push(pseudo_selectors[i]);
            }
        }
        if(selector.slice(0,1) != '.' && selector.slice(0,1) != '#' && selector){
            var tags = selector.replace(/"|\s*/g,"");

            return alltags.push(tags);
        }
    }
};
