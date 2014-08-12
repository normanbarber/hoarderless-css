var fs = require('fs');
var Q = require('q');
var _ = require('underscore');

var compareCode = {
    start: function (selectors) {
        var self = this;
        var xtracss_classes = {};
        var xtracss_ids = {};
        var xtracss_tags = {};
        var xtracss_attributes = {};
        var xtracss_complex_selectors = {};
        var xtracss = {};

        var css_complex_selectors = selectors.css.selectors.complexselectors;
        var css_classes = selectors.css.selectors.classes;
        var css_ids = selectors.css.selectors.ids;
        var css_tags = selectors.css.selectors.tags;
        var css_attributes = selectors.css.selectors.attributes;
        var view_classes = JSON.stringify(selectors.view.selectors.classes);
        var view_ids = JSON.stringify(selectors.view.selectors.ids);
        var view_attributes = JSON.stringify(selectors.view.selectors.attributes);
        var view_code = JSON.stringify(selectors.view.selectors.viewcode);

        var all = [];
        var promise = null;
        var errordata = {};

        promise = self.compareComplexSelectors(css_complex_selectors, view_code)
            .then(function(css_complex_selectors){
                xtracss_complex_selectors = css_complex_selectors;
                for(var i in css_classes){
                    xtracss_classes[i] = {};

                    var classarray = css_classes[i];
                    var xtracss_classes_tmp = [];
                    for(var j in classarray.selector){
                        if(view_classes.indexOf(classarray.selector[j]) === -1 && xtracss_classes_tmp.indexOf(classarray.selector[j]) === -1){
                            xtracss_classes_tmp.push(classarray.selector[j]);

                        }
                    }
                    xtracss_classes[i].filename = classarray.filename;
                    xtracss_classes[i].selector = xtracss_classes_tmp;
                }

            })
            .then(function(){
                for(var i in css_ids){
                    xtracss_ids[i] = {};
                    var idsarray = css_ids[i];
                    var xtracss_ids_tmp = [];
                    for(var j in idsarray.selector){

                        if(view_ids.indexOf(idsarray.selector[j]) === -1 && xtracss_ids_tmp.indexOf(idsarray.selector[j]) === -1){
                            xtracss_ids_tmp.push(idsarray.selector[j]);
                        }
                    }

                    xtracss_ids[i].filename = idsarray.filename;
                    xtracss_ids[i].selector = xtracss_ids_tmp;


                }

            })
            .then(function(){
                view_attributes = view_attributes.replace(/\"|\'|\\/g,"");
                var view_attributes_array = view_attributes.split(' ');
                var viewcode = JSON.parse(view_code);

                for(var i in css_attributes){
                    xtracss_attributes[i] = {};
                    var attributesarray = css_attributes[i];
                    var xtracss_attributes_tmp = [];


                    for(var j in attributesarray.selector){
                        var tag = attributesarray.selector[j];
                        var attributevalue = tag.match(/\[.*?\]/g);
                        tag = tag.replace(/\[.*?\]/g,"");
                        var attributefound = self.compare_attributes(viewcode, tag, attributevalue);
                        if(view_attributes.indexOf(attributesarray.selector[j]) === -1 && !attributefound)
                            xtracss_attributes_tmp.push(attributevalue);

                    }

                    xtracss_attributes[i].filename = attributesarray.filename;
                    xtracss_attributes[i].selector = xtracss_attributes_tmp;
                }


            })
            .then(function(){
                var viewfiles = selectors.view.selectors.viewcode;
                for(var i in css_tags){
                    xtracss_tags[i] = {};
                    var tagsarray = css_tags[i];
                    var tag = self.compareTags(viewfiles,tagsarray.selector);
                    var sel =xtracss_tags[i].selector;

                    if(tag){
                        xtracss_tags[i].filename = tagsarray.filename;
                        xtracss_tags[i].selector = tag;
                    }

                }
            })
            .then(function(){
                xtracss.classes = xtracss_classes;
                xtracss.ids = xtracss_ids;
                xtracss.tags = xtracss_tags;
                xtracss.attributes = xtracss_attributes;
                xtracss.advanced = xtracss_complex_selectors;
                return xtracss;
            })
            .fail(function(error) {
                return error;
            });

        all.push(promise);

        if(all.length > 0){

            return Q.allResolved(all)
                .then(function(promises) {
                    return Q(_.map(promises, Q.nearer));
                });
        }else{
            errordata.message = 'Error thrown while comparing css selectors with the view code';
            errordata.status = 'error';
            return Q.reject({error:errordata});
        }
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
    },
    compareComplexSelectors: function(css_complex_selectors,view_code){
        var xtracss_complex_selectors = {};

        for(var j in css_complex_selectors) {
            var unusedCss=[];
            var complex_css_array = css_complex_selectors[j];
            var selectorarray = complex_css_array.selector;

            for(var i in selectorarray){
                var is_complex_attribute = this.compare_complexAttributes(selectorarray[i]);
                if(!is_complex_attribute){
                    var selectorsplit = selectorarray[i].split(' ');
                    foundmatch = this.findUnusedSelectors(view_code,selectorsplit);
                    if(unusedCss.indexOf(selectorarray[i]) === -1 && !foundmatch){
                        unusedCss.push(selectorarray[i]);
                    }
                }
            }

            if (complex_css_array.selector.length > 0) {
                xtracss_complex_selectors[j] = {};
                xtracss_complex_selectors[j].filename = complex_css_array.filename;
                xtracss_complex_selectors[j].selector = unusedCss;
            }
        }
        return Q(xtracss_complex_selectors);
    },
    findUnusedSelectors: function(viewcode,selectorsplit){
        // recursive strategy to loop thru all selectors 2 at a time
        //  or 2 at a time plus the combinator if there is one
        var regex_operators =  />|\+|~/g;
        var selector1;
        var selector2;
        var operator;
        var selectors;

        if(selectorsplit.length === 1){
            var tagselector = this.getTagSelector(selectorsplit[0]);
            var tag = this.cssParser(viewcode,selectorsplit[0],tagselector);
            if(!tag)
                return false;

            var tagname = tag.tag;
            var dom = JSON.parse(viewcode);

            selectors = this.findMatches(dom,operator,tag);
            if(!selectors)
                return false;

            var onetag = this.matchTags(dom,selectors,operator);
            if(!onetag)
                return false;
            else
                return true;
        }

        var selectorarray = selectorsplit.splice(0,3);
        var operator1 = selectorarray[0].match(regex_operators);
        var operator2 = selectorarray[1].match(regex_operators);

        // if there is an operator handle it first
        if(operator1 || operator2){
            if(selectorsplit.length >= 1)
                selectorsplit.unshift(selectorarray[2]);
            if(operator1){
                return true;
            }
            if(operator2){
                selector1 = selectorarray[0];
                selector2 = selectorarray[2];
                operator = selectorarray[1];
            }

        }else{
            console.log('operator not found so compare 2 tags at a time');
            if(selectorsplit.length >= 1 || (selectorarray.length === 3 && !operator1 && !operator2)){
                selectorsplit.unshift(selectorarray[2]);
                selectorsplit.unshift(selectorarray[1]);
            }

            console.log('unshitft selector array = ' + selectorsplit);
            selector1 = selectorarray[0];
            selector2 = selectorarray[1];
            operator = null;

        }

        // checking if the first selector is found in the dom
        var tagselector = this.getTagSelector(selector1);
        var tag1 = this.cssParser(viewcode,selector1,tagselector);

        // if tag not found in the dom end the match on this selector
        if(!tag1)
            return false;

        var tagname1 = tag1.tag;
        var dom = JSON.parse(viewcode);
        selectors = this.findMatches(dom,operator,tag1);

        if(!selectors)
            return false;
        viewcode = this.matchTags(dom,selectors,operator);

        // if the first selector was found to exist in the view continue else it will return false
        if(viewcode){
            // checking if the second selector is found in the dom
            var tagselector = this.getTagSelector(selector2);
            var tag2 = this.cssParser(viewcode,selector2,tagselector);

            // if tag not found in the dom end the match on this selector
            if(!tag2)
                return false;

            var tagname2 = tag2.tag;
            dom = JSON.parse(viewcode);


            // find any matches to nth-child first-child last-child :not or [class=""]
            var matchfound = this.findMatches(dom,operator,tag2);


            // todo 2014-08-09 check comment below
            // adding conditational here for nth first and last child etc
            // because getting an error with data-dog=jack because findMatches return false since it doesnt exist in view - thead#teemyhead.babalon[data-dog="jack"]
            if(!matchfound)
                return false;

            console.log('\n\n\n------------------------- matchfound matchfound ---------------------------')
            console.log(matchfound);

            var filetag;
            if(selectorsplit.length <= 1 && matchfound){
                if(operator){
                    // need this when there is a combinator found  ie .buggerfefe#hadder > #dinkytd span
                    var dom = JSON.parse(viewcode);
                    var operatormatch = this.identifyOperator(dom, operator, tag1, matchfound);
                    // if  no match found using the operator
                    // else found match for selector
                    if(!operatormatch){
                        console.log('this has no match found using the operator ');
                        return false;
                    }else{
                        console.log('found match for selector1  and filetag = ');
                        return true;
                    }

                }else{
                    // else if there is no operator to use for the match
                    // do an overall match for the last tag/selector in the group using elements left in the view
                    filetag = this.matchTags(dom,matchfound,operator);
                    // if found match for filetag
                    // else this tag was not found in view
                    if(filetag){
                        console.log('found match for selector1  and filetag = ');
                        return filetag
                    }else{
                        console.log('this tag has no child named ');
                        return false;
                    }
                }

            }else if(!matchfound){
                // else match not found doing comparison with the operator used between the selectors
                console.log('returning false match not found doing comparison with the operator used between the selectors');
                return false;
            }
        }else{
            // else not found in view
            console.log('this selector was not found in the view');
            return false;
        }
        return this.findUnusedSelectors(viewcode,selectorsplit);
    },
    findMatches: function(viewcode,operator,selector){
        tagname = selector.tag;
        if(tagname.match(/\:nth-child/g)){
            var nthchild = tagname.match(/\((.*?)(?=\))/g);
            nthchild = nthchild.toString().slice(1);
            nthchild = nthchild.replace(/[^0-9]+/g, "");
            tagname = tagname.replace(/\(.*?\)/g,"").replace(/:nth-child/g,"");
            selector.tag = tagname;

            var nthchildfound = this.compare_nthChild(viewcode, selector, tagname, nthchild);
            if(!nthchildfound)
                return false;
        }
        if(tagname.match(/\:first-child|\:last-child/g)){
            var nthchild = 1;
            tagname = tagname.replace(/:first-child/g,"").replace(/:last-child/g,"");
            selector.tag = tagname;

            var nthchildfound = this.compare_nthChild(viewcode, selector, tagname, nthchild);
            if(!nthchildfound)
                return false;
        }
        if(tagname.match(/\:not/g)){
            var notvalue = tagname.match(/\((.*?)(?=\))/g);
            notvalue = notvalue.toString().slice(1);
            tagname = tagname.replace(/\(.*?\)/g,"").replace(/:not/g,"");
            selector.tag = tagname;

            var notvaluefound = this.compare_negation(viewcode, selector.selectors, tagname, notvalue);
            if(!notvaluefound)
                return false;

        }
        if(tagname.match( /\[(.*?)(?=\])/g)){
            var attrvalue = tagname.match(/\[.*?\]/g);
            tagname = tagname.replace(/\[.*?\]/g,"");
            selector.tag = tagname;

            var attributefound = this.compare_attributes(viewcode, tagname, attrvalue);
            if(!attributefound)
                return false;
        }
        console.log('selector = ', selector);
        return selector;
    },
    findIds: function(attribute){
        var view_attribute_ids = attribute.match(/id="(.*?)"/gm);
        var rep_view_attribute_ids = view_attribute_ids.toString().replace(/id="|"/g,"");
        return rep_view_attribute_ids;
    },
    findClasses: function(attribute){
        var view_attribute_classes = attribute.match(/class="(.*?)"/gm);
        var rep_view_attribute_classes = view_attribute_classes.toString().replace(/class="|"/g,"");
        return rep_view_attribute_classes;
    },
    findViewTagMatch: function(tag,viewdom){
        for(var i in viewdom){
            var file = viewdom[i].dom;
            // loop thru line of code
            for(var j in file){
                if(tag === file[j].tag){
                    return file[j];
                }
            }
        }
        return false;
    },
    matchViewTagByAttributes: function(viewattribute,attribute){
        var classes_array=[];
        var ids_array=[];
        var allmatched;
        var selectorslength;
        var viewclasses;
        var viewids;

        if(viewattribute.match(/id="(.*?)"/gm)){
            viewids = this.findIds(viewattribute);
            viewids = viewids.split(' ');
        }
        if(viewattribute.match(/class="(.*?)"/gm)){
            viewclasses = this.findClasses(viewattribute);
            viewclasses = viewclasses.split(' ');
        }

        if(attribute.match(/class="(.*?)"/gm)){
            var attribute_classes = this.findClasses(attribute);
            classes_array = attribute_classes.split(' ');
        }
        if(attribute.match(/id="(.*?)"/gm)){
            var attribute_ids = this.findIds(attribute);
            ids_array = attribute_ids.split(' ');
        }

        selectorslength = classes_array.length + ids_array.length;
        allmatched = 0;
        if(ids_array.length >= 1){
            // loop thru each id in ids_array
            for(var m in ids_array){
                // loop thru each id in this line from the view and look for matches
                for(var n in viewids){
                    if(viewids[n] == ids_array[m]){
                        allmatched++;
                        if(allmatched == selectorslength){
                            return true;
                        }
                    }
                }
            }
        }

        if(classes_array.length >= 1){
            // loop thru each class in the classes_array
            for(var m in classes_array){
                // loop thru each class in this line from the view and look for matches
                for(var n in viewclasses){
                    if(viewclasses[n] == classes_array[m]){
                        allmatched++;
                        if(allmatched == selectorslength){
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    },
    getViewElement: function(viewdom,attribute,tagname){
        var classes_array=[];
        var ids_array=[];
        var tag;
        var allmatched;

        if(attribute.match(/class="(.*?)"/gm)){
            var attribute_classes = this.findClasses(attribute);
            classes_array = attribute_classes.split(' ');
        }
        if(attribute.match(/id="(.*?)"/gm)){
            var attribute_ids = this.findIds(attribute);
            ids_array = attribute_ids.split(' ');
        }
        selectorslength = classes_array.length + ids_array.length;

        // loop thru each file in directory
        for(var i in viewdom){
            var file = viewdom[i].dom;
            // loop thru line of code
            for(var j in file){
                var viewclasses;
                var viewids;
                var viewattributes;
                var viewcodeattributes = file[j].attributes.toString();

                if(viewcodeattributes.match(/id="(.*?)"/gm)){
                    viewids = this.findIds(viewcodeattributes);
                    viewids = viewids.split(' ');
                }
                if(viewcodeattributes.match(/class="(.*?)"/gm)){
                    viewclasses = this.findClasses(viewcodeattributes);
                    viewclasses = viewclasses.split(' ');
                }

                allmatched = 0;
                if(ids_array.length >= 1){
                    // loop thru each id in ids_array
                    for(var m in ids_array){
                        // loop thru each id in this line from the view and look for matches
                        for(var n in viewids){
                            if(viewids[n] == ids_array[m]){
                                allmatched++;
                                if(allmatched == selectorslength){
                                    if(tagname && file[j].tag == tagname){
                                        tag = file[j];
                                        return tag;
                                    }else if(!tagname){
                                        tag = file[j];
                                        return tag;
                                    }
                                }
                            }
                        }
                    }
                }
                if(classes_array.length >= 1){
                    // loop thru each class in the classes_array
                    for(var m in classes_array){
                        // loop thru each class in this line from the view and look for matches
                        for(var n in viewclasses){
                            if(viewclasses[n] == classes_array[m]){
                                allmatched++;
                                if(allmatched == selectorslength){
                                    if(tagname && file[j].tag == tagname){
                                        tag = file[j];
                                        return tag;
                                    }else if(!tagname){
                                        tag = file[j];
                                        return tag;
                                    }

                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    },
    matchTags: function(viewfiles,tag,operator){
        // 3) compares tag and its selectors with the view searching for a match
        // iterates thru viewfiles searching for a match. if it finds the match it will create a more specific 'dom structure' saving everything from that tag to the new viewfiles.
        // also saving children and siblings belonging to the tag

        // if its a tag that has selectors then it needs to perform a more specific match
        // else if its just a tag with no classes or ids
        var view_code_obj = [];
        var attribute = tag.selectors;
        var classes_array=[];
        var ids_array=[];
        var selectorslength=0;
        var child_array_index=1;

        if(attribute.match(/class="(.*?)"/gm)){
            var attribute_classes = this.findClasses(attribute);
            classes_array = attribute_classes.split(' ');
        }
        if(attribute.match(/id="(.*?)"/gm)){
            var attribute_ids = this.findIds(attribute);
            ids_array = attribute_ids.split(' ');
        }
        selectorslength = classes_array.length + ids_array.length;

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
                    // if the number of tabs for the current tag in the iteration is less than
                    // the number of tabs for the tag passed in then it not a child so not needed here
                    if(viewcode[j].tabindents < tag.tabindents){
                        matchfound = false;
                    }
                    var siblings_array_index=1;

                    // tag.selectors is a property of the tag argument thats passed into this function
                    // this conditional is matching the current attributes looping thru the iteration with the tag.selectors that were passed in
                    // if it returns true it will start at that point saving each element after as long as they are children(or siblings) of the tag element or children of children
                    if(!matchfound){
                        matchfound = this.matchViewTagByAttributes(viewcode[j].attributes,tag.selectors);
                    }

                    // check if matchTag is true  or if this current element is saved in the childarray/siblingsarray ( childarray is an array of all children under the current tag )
                    if(matchfound || childarray.indexOf(viewcode[j].tag) >= 0 || siblingsarray.indexOf(viewcode[j].tag) >= 0){
                        var siblings = viewcode[j].siblings;
                        for(var k in siblings){
                            siblingsarray.push(siblings[k]);
                        }

                        var children = viewcode[j].children;
                        for(var k in children){
                            childarray.push(children[k]);
                        }
                        // note: child_array_index is the number of children we are adding to the new dom. When the index reaches childarray.length it will stop
                        // note: may need to do one more check for tabindents so it doesnt save any parent elements to childarray or siblingsarray. dont need parent tags right now
                        if(childarray.indexOf(viewcode[j].tag) >= 0 && child_array_index <= childarray.length){
                            // note: only want to save/push this element if its a child or sibling that why it checks that the tabindents is greater than(child) or equal to(sibling) the curren tag
                            if(viewcode[j].tabindents > tag.tabindents){
                                child_array_index++;
                                var children = viewcode[j].children;
                                for(var k in children){
                                    childarray.push(children[k]);
                                }
                            }
                        }
                        if(siblingsarray.indexOf(viewcode[j].tag) >= 0 && siblings_array_index <= siblingsarray.length && (operator === '~' || operator === '+')){
                            // note: only want to save/push this element if its a child or sibling that why it checks that the tabindents is greater than(child) or equal to(sibling) the curren tag
                            if(viewcode[j].tabindents > tag.tabindents){
                                siblings_array_index++;
                                var siblings = viewcode[j].siblings;
                                for(var k in siblings){
                                    siblingsarray.push(siblings[k]);
                                }
                            }
                        }
                        // if match is found and the current tag looping thru in the interation is a child of the tag passed in then we keep it
                        // else check the combinator and its an adjacent or sibling then push it
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

    },
    identifyTagName: function(selector){
        var tagname;
        if(selector.match(/\w(.*?)\./g) && selector.match(/\w(.*?)\#/g)){
            tagname = selector.split('.');
            tagname = tagname[0].split('#');
            return tagname[0];
        }
        else if(selector.match(/\w(.*?)\./g)){
            tagname = selector.split('.');
            return tagname[0];
        }
        else if(selector.match(/\w(.*?)\#/g)){
            tagname = selector.split('#');
            return tagname[0];
        }
        else
            return selector;
    },
    getTagSelector: function(selector){
        // returns the tag ( tr ) and the :nth-child() if it has one
        // returns the tag not the chained classes/ids

        var targetnthchild;
        var targetnotchild;
        var targetnumber;
        var tagselector = null;

        if(selector.match(/\s*\:\s*first-child|\s*\:\s*nth-child\s*|\s*\:\s*last-child|\:not|\[(.*?)(?=\])/g)){
            if(selector.match(/\s*\:\s*nth-child\s*/g)){
                targetnthchild = selector.match(/\s*\:\s*nth-child/g);
                targetnumber = selector.match(/\(.*?\)/g);
                tagselector = targetnthchild + targetnumber;
            }
            else if(selector.match(/\s*\:\s*first-child/g)){
                tagselector = selector.match(/\s*\:\s*first-child/g);
            }
            else if(selector.match(/\s*\:\s*last-child/g)){
                tagselector = selector.match(/\s*\:\s*last-child/g);
            }
            else if(selector.match(/\:not/g)){
                targetnotchild = selector.match(/\:not/g);
                targetnumber = selector.match(/\(.*?\)/g);
                tagselector = targetnotchild + targetnumber;
            }
            else if(selector.match(/\[(.*?)(?=\])/g)){
                targetnotchild = selector.match(/\[.*?\]/g);
                tagselector = targetnotchild;
            }

            return tagselector;

        }else
            return null
    },
    cssParser: function(viewdom,selector,tagselector){
        // checking tags identifying all classes and ids chained together
        // if the chained id/class does not exist then it will return false and end execution

        var tagdata = {};
        var attributes;
        var tag;
        var tagelement = {};
        var allattributes;
        var classarray=[];
        var idsarray=[];
        var tags_array = selector.split('\t');
        var current_tab_indents = tags_array.length;
        var tagname;

        selector = selector.replace(/\(.*?\)/g,"").replace(/:nth-child/g,"").replace(/:first-child/g,"").replace(/:last-child/g,"").replace(/:not/g,"").replace(/\[.*?\]/g,"");
        if(selector.slice(0,1) == '#' || selector.slice(0,1) == '.'){
            attributes = selector.split('#');
        }
        else{
            attributes = selector.match(/[^(#)]+/g);
            tagname = tags_array[current_tab_indents - 1].match(/[^\A]+(?=\.)|[^\A]+(?=\#)|[^\A]+(?=\()|([^\s]+)/g);
            if(tagname[0].match(/\#/g))
                tagname = tagname[0].match(/[^\A]+(?=\#)/g);

            if(tagname[0].match(/\./g))
                tagname = tagname[0].match(/[^\A]+(?=\.)/g);

        }

        for(var i in attributes){
            var classes = attributes[i].split('.');

            if(i==0){
                // if a class is first
                if(classes.length > 1){
                    for(var c=1; c<=classes.length; c++){
                        if(classes[c]){

                            classarray.push(classes[c]);
                        }
                    }
                }
            }
            else if(i >= 1){

                var attribute_ids = classes[0].match(/id="(.*?)"/gm);
                var attribute_classes = classes[0].match(/class="(.*?)"/gm);

                if(classes.length > 1){
                    // handles classes(.) and loops through them if chained together
                    for(var c=1; c<=classes.length; c++){
                        if(classes[c]){

                            classarray.push(classes[c]);
                        }
                    }


                }else if(classes[0] && attribute_ids){
                    // handle attributes in parens
                    var idreplace = attribute_ids[0].replace(/id="|"/g,"");
                    var idreplacearray = idreplace.split(' ');

                    for(var i=0; i<idreplacearray.length; i++){
                        if(idreplacearray[i]){

                            idsarray.push(idreplacearray[i]);
                        }
                    }

                }if(classes[0] && attribute_classes){
                    // handle jade classes in parens loops thru all if more than one and saves to an array
                    var classreplace = attribute_classes[0].replace(/class="|"/g,"");
                    var classreplacearray = [];

                    classreplacearray = classreplace.split(' ');
                    for(var i=0; i<classreplacearray.length; i++){
                        if(classreplacearray[i]){
                            classarray.push(classreplacearray[i]);
                        }
                    }
                    attribute_classes.push(classes[0]);
                }
                if(classes[0] && !attribute_ids){
                    idsarray.push(classes[0]);
                }
            }

        }

        allattributes = this.formatAttributes(classarray,idsarray);
        data_attributes = null;
        viewdom = JSON.parse(viewdom);

        // if we have tag plus classes, ids, nthchild, lastchild, negation etc do the if
        // else if its just a tag
        if(allattributes || allattributes && selector.slice(0,1) === '.' || allattributes && selector.slice(0,1) === '#' || allattributes && selector.slice(0,1) === '['){
            if(selector.slice(0,1) != '.' && selector.slice(0,1) != '#' && selector.slice(0,1) != '['){
                tag = this.identifyTagName(selector);
                var tagfound = this.findViewTagMatch(tag, viewdom);
                if(!tagfound)
                    return false;
            }

            tagelement = this.getViewElement(viewdom,allattributes,tag);
            tag = tagelement.tag;
            if(!tagelement)
                return false;

        }
        else{
            tagelement.tabindents = '';
            tag = this.identifyTagName(selector);
            var tagfound = this.findViewTagMatch(tag, viewdom);

            if(!tagfound)
                return false;

        }
        tagdata.selectors = allattributes;

        if(tagselector)
            tagdata.tag = tag + tagselector;
        else
            tagdata.tag = tag;

        tagdata.tabindents = tagelement.tabindents;
        return tagdata;
    },
    formatAttributes: function(classarray,idsarray){
        var classstr = '';
        var idstr = '';
        var idattributes;
        var classattributes;
        var allattributes;

        for(var c in classarray){
            classstr = classstr + ' ' + classarray[c];
        }

        for(var i in idsarray){
            idstr = idstr + ' ' + idsarray[i];
        }

        if(idstr)
            idattributes = 'id="' + idstr + '"';
        else
            idattributes = null;


        if(classstr)
            classattributes = 'class="' + classstr + '"';
        else
            classattributes = null;

        allattributes =    (classattributes ? classattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + (classattributes && idattributes ? ' ' : '')
            + (idattributes ? idattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + (classattributes || idattributes ? ' ' : '');

        return allattributes;
    },
    identifyOperator: function(viewcode, operator, tag1, tag2){

        var tagname1 = tag1.tag;
        var tagname2 = tag2.tag;
        var operatorfound;
        if(operator && operator.match(/>/g))
            operatorfound = this.compare_DirectChildren(viewcode,operator, tag2, tag1, tagname2);
        else if(operator && operator.match(/~/g))
            operatorfound = this.compare_Siblings(viewcode,operator, tag2, tag1, tagname2);
        else if(operator && operator.match(/\+/g))
            operatorfound = this.compare_Adjacent(viewcode, tagname1, tagname2);

        return operatorfound;

    },
    compare_DirectChildren: function(viewcode, operator, tag2, tag1, tagname2){
        // tag ->  direct children  (  >  )
        // select direct or first child of a tag
        var matchfound;
        var tagname1 = tag1.tag;
        var tag = tagname2;
        for(var i in viewcode){

            for(var j in viewcode[i].dom){
                if(!tag2.selectors && viewcode[i].dom[j].tag === tagname2){
                    if(viewcode[i].dom[j].tabindents - tag1.tabindents == 1){
                        return true;
                    }
                }else{
                    matchfound = this.matchViewTagByAttributes(viewcode[i].dom[j].attributes,tag2.selectors);
                    if(matchfound && (viewcode[i].dom[j].tabindents - tag1.tabindents == 1)){
                        return true;
                    }
                }
            }
        }
        return false;
    },
    compare_Siblings: function(viewcode, operator, tag2, tag1, tagname2){
        // tag -> sibling ( ~ )
        var matchfound;
        var tagname1 = tag1.tag;
        var tag = tagname2;
        for(var i in viewcode){
            for(var j in viewcode[i].dom){
                if(!tag2.selectors && viewcode[i].dom[j].tag === tagname1){
                    if(tag1.selectors){
                        matchfound = this.matchViewTagByAttributes(viewcode[i].dom[j].attributes,tag1.selectors);

                        var tagsiblings = viewcode[i].dom[j].siblings;
                        for(var k in tagsiblings){
                            if(matchfound && tagsiblings[k] === tagname2){
                                return true;
                            }

                        }
                    }else if(!tag1.selectors){
                        var tagsiblings = viewcode[i].dom[j].siblings;
                        for(var k in tagsiblings){
                            if(tagsiblings[k] === tagname2){
                                return true;
                            }

                        }
                    }
                }else if(tag2.selectors && viewcode[i].dom[j].tag === tagname1){
                    var tagsiblings = viewcode[i].dom[j].siblings;
                    for(var k in tagsiblings){
                        if(tagsiblings[k] === tag2.tag){

                            for(var m in viewcode[i].dom){
                                if(viewcode[i].dom[m].tag === tagname2){
                                    matchfound = this.matchViewTagByAttributes(viewcode[i].dom[m].attributes,tag2.selectors);
                                    if(matchfound && parseInt(m) != parseInt(j))
                                        return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    },
    compare_nthChild: function(viewcode, selector, tagname, n){
        var tagfound;
        var element;
        var tagfound;
        var siblingscount = 1;

        for(var i in viewcode){
            for(var j in viewcode[i].dom){
                if(!selector.selectors && viewcode[i].dom[j].tag === tagname){
                    if(n === 1)
                        return true;

                    var tagsiblings = viewcode[i].dom[j].siblings;
                    for(var k in tagsiblings){
                        if(tagsiblings[k] === tagname){
                            siblingscount++;
                            if(siblingscount > parseInt(n))
                                return true
                        }
                    }
                }else if(selector.selectors && viewcode[i].dom[j].tag === tagname){
                    matchfound = this.matchViewTagByAttributes(viewcode[i].dom[j].attributes,selector.selectors);
                    if(matchfound){
                        if(n === 1)
                            return true;

                        var tagsiblings = viewcode[i].dom[j].siblings;
                        for(var k in tagsiblings){
                            if(tagsiblings[k] === tagname){
                                siblingscount++;
                                if(siblingscount > parseInt(n))
                                    return true
                            }
                        }
                    }
                }
            }
        }
        return false;
    },
    compare_negation: function(viewcode, attributes, selector, notvalue){
        // tag ->  negation  (  :not()  )
        var matchtag;
        var element;
        var code = JSON.stringify(viewcode);
        var tagselector = this.getTagSelector(selector);
        var tag = this.cssParser(code,selector,tagselector);
        if(!tag)
            return false;

        var tagname = tag.tag;
        var sel = this.findMatches(viewcode,null,tag);
        var onetag = this.matchTags(viewcode,sel,null);
        onetag = JSON.parse(onetag);

        if(notvalue.slice(0,1) === '.' || notvalue.slice(0,1) === '#'){
            return true;
        }else{
            for(var i in onetag){
                var file = onetag[i].dom;
                for(var j in file) {
                    matchtag = selector.match(file[j].tag);
                    if(matchtag){
                        element = file[j];

                        var tagchildren = file[j].children;
                        for(var k in tagchildren){
                            if(tagchildren[k] === notvalue){
                                return true;
                            }
                        }
                    }
                }

            }
            return false;
        }
    },
    compare_attributes: function(viewcode, selector, attribute){
        attribute = attribute.toString().replace(/'|\[|\]/g,"");
        var is_complex_attribute = this.compare_complexAttributes(attribute);
        if(is_complex_attribute)
            return true;

        var attribute_array = attribute.split(',');
        var matchtag;
        var element;
        for(var i in viewcode){

            var file = viewcode[i].dom;
            for(var j in file) {
                matchtag = selector.match(file[j].tag);
                if(matchtag || !selector){
                    element = file[j];
                    var tagattributes = file[j].attributes.replace(/"/g,"");
                    var tagattributes_array = tagattributes.split(' ');
                    for(var k in tagattributes_array){
                        for(var m in attribute_array){
                            if(tagattributes_array[k] && attribute_array[m] === tagattributes_array[k]){
                                return true;
                            }
                        }

                    }

                }
            }
        }
        return false;
    },
    compare_complexAttributes: function(selector){
        if(selector.match(/\^\=|\*\=|\?\=/g))
            return true;
        else
            return false;

    },
    compare_Adjacent: function(viewcode, tagname1, tagname2){
        // tag ->  adjacent  (  +  )
        var tag = tagname2;
        for(var i in viewcode){
            for(var j in viewcode[i].dom){
                if(viewcode[i].dom[j].tag === tagname1){
                    if(viewcode[i].dom[j].tabindents === viewcode[i].dom[0].tabindents){
                        var tagsiblings = viewcode[i].dom[0].siblings;
                        if(tagsiblings[0] === tag){
                            return true;
                        }
//                    }
                    }
                }
            }
        }
        return false;
    }
}

module.exports = function(selectorsobj, callback) {
    compareCode.start(selectorsobj)
        .then(function(code){
            return callback(null, code);
        })
        .fail(function(err) {
            return callback(err, null);
        });
};

