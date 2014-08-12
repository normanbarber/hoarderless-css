var fs = require('fs');
var Q = require('q');
var _ = require('underscore');

module.exports = {

    start: function(filename,codearray){
        var viewtag = {};
        viewtag.dom = {};
        var allclasses = [];
        var allids = [];
        var attributes_array = [];
        var classesindex = 0;
        var idsindex = 0;

        for(var k in codearray) {
            var oneline = codearray[k].split('\t');
            if(!oneline[oneline.length - 1]){
                codearray.splice(parseInt(k),1);
            }
        }

        for(var k in codearray) {

            var allattributes = {};
            var classarray=[];
            var idsarray=[];
            var data_attributes_array = [];
            var data_attributes;
            var data_attributes_tmp = [];

            var attribute_classes;
            var attribute_ids;

            codearray[k] = codearray[k].replace(/\s*=\s*/g,"=");


            if(codearray[k].match(/ng-style/g)){
                //console.log(codearray[i]);
                // codearray[i] = codearray[i].replace(/ng\s*:\s*repeat="(.*?)",/g,"").replace(/ng\s*:\s*."(.*?)",/g,"").replace(/ng-class."(.*?)",|data-ng-class."(.*?)",|data-ng-class="(.*?)"/g,"").replace(/style="(.*?)",|style="(.*?)"/g,"");
                //codearray[i] = codearray[i].replace(/ng\s*:\s*repeat="(.*?)",|ng\s*:\s*repeat="(.*?)"|ng\s*-\s*model="(.*?)",|ng\s*-\s*model="(.*?)"|ng-repeat="(.*?)",|ng-repeat="(.*?)"|data-ng-repeat="(.*?)",/g,"").replace(/style="(.*?)",|style="(.*?)"|ng\s*:\s*style="(.*?)",|ng\s*:\s*style="(.*?)"|ng-style="(.*?)",|ng-style="(.*?)"/g,"");
                codearray[k] = codearray[k].replace(/style="(.*?)",|style="(.*?)"|ng\s*:\s*style="(.*?)",|ng\s*:\s*style="(.*?)"|ng-style="(.*?)",|ng-style="(.*?)"/g,"");
            }


            // handle everyting in tags parens
            if(codearray[k].match(/\(.*?\)/g)){
                data_attributes = codearray[k].match(/\(.*?\)/g);
                // comparing css selectors to view tags does not require any function calls removing those calls and their args here too
//                var attribute_spaces = data_attributes[0].replace(/<~>/g," ").replace(/\./g,"").replace(/\A(.*?)/g,"");
                var attribute_spaces = data_attributes[0].replace(/<~>/g," ").replace(/\./g,"");
                data_attributes = attribute_spaces.replace(/\(|\)/g,"");
                attribute_classes = data_attributes.match(/class="(.*?)"/gm);
                if(attribute_classes){
                    attribute_classes = attribute_classes[0].replace(/class="|"/g,"");

                    var attribute_classes_array = attribute_classes.split(' ');
                    for(var i in attribute_classes_array){
                        classesindex = allclasses.length;
                        allclasses[classesindex] = {"filename" : filename, "selector" : attribute_classes_array[i]};
                        classarray.push(attribute_classes_array[i]);
                    }
                }

                attribute_ids = data_attributes.match(/id="(.*?)"/gm);
                if(attribute_ids){
                    attribute_ids = attribute_ids[0].replace(/id="|"/g,"");

                    var attribute_ids_array = attribute_ids.split(' ');
                    for(var i in attribute_ids_array){
                        idsindex = allids.length;
                        allids[idsindex] = {"filename" : filename, "selector" : attribute_ids_array[i]};
                        idsarray.push(attribute_ids_array[i]);
                    }
                }

                data_attributes = data_attributes.replace(/class="(.*?)"/g,"").replace(/id="(.*?)"/g,"").replace(/,/g,"").replace(/\s*:\s*/g,":").replace(/\s\s+/g," ");
                data_attributes_tmp = data_attributes.split(',');

                for(var i in data_attributes_tmp){

                    if(data_attributes_tmp[i])
                        data_attributes_array.push(data_attributes_tmp[i]);
                }
                codearray[k] = codearray[k].replace(/\(.*?\)/g,"");

            }else{
                data_attributes='';
            }

            var attributes = codearray[k].match(/[^(#)*?]+(?=)/g);
            var tags_array = codearray[k].split('\t');  // the codearray gets split so every tab gets replaced with an empty index. the last index in tags_array with be the line of code. so i use the length - 1 to determine how many tabs in each line of code
            var current_tab_indents = tags_array.length;


            var tagname = tags_array[current_tab_indents - 1].match(/[^\A]+(?=\.)|[^\A]+(?=\#)|[^\A]+(?=\()|([^\s]+)/g);

            if(tagname[0].match(/\#/g))
                tagname = tagname[0].match(/[^\A]+(?=\#)/g);

            if(tagname[0].match(/\./g))
                tagname = tagname[0].match(/[^\A]+(?=\.)/g);

            for(var i in attributes){
                var classes = attributes[i].split('.');

                if(i==0){
                    // if a class is first push to class array
                    if(classes.length > 1){
                        tagname[0] = classes[0].replace(/\s*|"/g,"");
                        for(var c=1; c<=classes.length; c++){
                            if(classes[c]){
                                classesindex = allclasses.length;
                                allclasses[classesindex] = {"filename" : filename, "selector" : classes[c]};
                                classarray.push(classes[c]);
                            }
                        }
                    }
                }
                else if(i >= 1){

                    var attribute_ids = classes[0].match(/id="(.*?)"/gm);
                    var attribute_classes = classes[0].match(/class="(.*?)"/gm);

                    if(classes.length > 1){
                        // handles jade classes  or (.) and loops through them if chained together
                        for(var c=1; c<=classes.length; c++){
                            if(classes[c]){
                                classesindex = allclasses.length;

                                allclasses[classesindex] = {"filename" : filename, "selector" : classes[c]};
                                classarray.push(classes[c]);
                            }
                        }


                    }else if(classes[0] && attribute_ids){
                        // handle attributes in parens
                        var idreplace = attribute_ids[0].replace(/id="|"/g,"");
                        var idreplacearray = idreplace.split(' ');
                        tagname[0] = tagname[0];
                        for(var i=0; i<idreplacearray.length; i++){
                            if(idreplacearray[i]){
                                idsindex = allids.length;
                                allids[idsindex] = {"filename" : filename, "selector" : idreplacearray[i]};
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
                                classesindex = allclasses.length;
                                allclasses[classesindex] = {"filename" : filename, "selector" : classreplacearray[i]};
                                classarray.push(classreplacearray[i]);
                            }

                        }
                        attribute_classes.push(classes[0]);


                    }
                    if(classes[0] && !attribute_ids){
                        idsindex = allids.length;
                        allids[idsindex] = {"filename" : filename, "selector" : classes[0]};
                        idsarray.push(classes[0]);
                    }
                }
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
            }

            var allattributes =    (classattributes ? classattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + (classattributes && idattributes ? ' ' : '')
                + (idattributes ? idattributes.replace(/\s+"/g, '"').replace(/"\s+/g, '"') : '') + ((data_attributes_array.length > 0) && (classattributes || idattributes) ? ' ' : '')
                + (data_attributes_array ? data_attributes_array : '');

            data_attributes = null;

            if(allattributes)
                attributes_array.push(allattributes);

            if(tagname[0].match(/\./g) || tagname[0].match(/\#/g)){
                if(tagname[0].match(/\#/g)){
                    tagname[0] = tagname[0].replace(/\#.+/g,"");
                }
                if(tagname[0].match(/\./g))
                    tagname[0] = tagname[0].replace(/\..+/g,"");

            }


            var children_array = this.getChildren(codearray,k,current_tab_indents);
            var siblings_array = this.getSiblings(codearray,k,current_tab_indents);

            viewtag.dom[k]= {};
            viewtag.dom[k].tag = tagname[0];
            viewtag.dom[k].attributes = allattributes;
            viewtag.dom[k].children = children_array;
            viewtag.dom[k].siblings = siblings_array;
            viewtag.dom[k].tabindents = current_tab_indents;

        }
        viewtag.classes = allclasses;
        viewtag.ids = allids;
        viewtag.attributes = attributes_array;
        viewtag.dom = viewtag.dom;
        return viewtag;
    },
    getChildren: function(codearray,current_tag_index,current_tab_indents){

        // current_tag_index - index of the array for the html tag you are passing in
        // current_tab_indents - number of tab indents the tag has in the jade file. use this to help find the tags children

        // done todo 2014-07-02 compare other types of tags with classes/ids tags with children and just tags and just classes and ids
        // done todo 2014-07-02 li tag - look at how im going to handle tags ike li: a() and div(ng-view) it is saveing ng-view as an id
        // done todo 2014-07-02 div(ng-view) add id=() and class=() test out where directive should go
        // done todo 2014-07-02 div ng-view has ul as its child should not have children
        // done todo 2014-07-02 handling other attributes like (data-dog="bucky")
        // done todo 2014-07-02 save more than one child save nth-child(2) and (3)

        // done todo 2014-07-02 domAdv has tags like tr#bugger and should just be tr
        // done todo 2014-07-02 add filename to viewcode
        // done todo 2014-07-02 - too many quotes in domAdv attributes
        // done todo 2014-07-02 index.jade the first div is not added to domAdv  - done the ul and li are not returning the correct children. maybe cuz of one of the index are incorrect
        // done todo 2014-07-02 - seems to be a problem with #mudda(ng-view) with the ids and custom directives / custom sttributes
        // done todo 2014-07-08 - in compare.js tag are matching even in partial match cases. ie if there is a tag in the css called tddd and it compares and find a tag in the dom called td it will return true for match found. instead do an exact match for there
        // done todo 2014-07-08 - work on adjacent

        // done todo 2014-07-08 - testing commas,  ul > li, .dannyfairy
        // done todo 2014-07-08 - check nth-child rules
        // done todo 2014-07-08 - add :not to adv selectors
        // done todo 2014-07-08 - test chaining classes and using complex operators
        // done todo 2014-07-08  - replace all chars ie n with blank spaces, this selects every 4th list item - li:nth-child(4n)
        // done todo 2014-07-08  - nth child is wrong the way i have it now
        // done todo 2014-07-10 -  in codeReaderCss need to handle all pseudo class selectors like div:hover - only need to grab the tags for these
        // done - todo 2014-07-16 - tonight testing out double and single quotes in view and css - tested seems ok
        // done todo 2014-07-16 - tonigh test this using spaces instead of tabs - spaces don't work - fixed can replace 4 spaces with one tab before pushing to array
        // done todo 2014-07-16 - cssreader - handle complex selectors with attributes ie "span[class=frank] div[id=infurter]"
        // done todo 2014-07-08  - what happens in compare when i have one tag with chained selectors ie tr.baggerfee#anid
        // todo 2014-07-10 - still need to add code that splits up the negation tag if it has ids or classes chained to it ie  tr.buggerfefe#hadder td:not(span.spannedclass#anid)
        // todo 2014-07-10 -  handling ng-classes
        // todo 2014-07-08 - chaining together nth-child first-child last-child
        // todo 2014-07-02 - make sure data is correct thru each step
        // todo 2014-07-16 - handling view code for if conditionals and code that starts with a hyphen ( - )
        // done todo 2014-07-20 - found issue when only 2 are in complexselectors ie tr#hadder > td:first-child  cuz the viewdom returned for tr#hadder is not being narrowed down correctly. td:first-child checks the entire dom
        // done todo 2014-07-20 -  index.jade when i compare a css sel ul li.listclass:first-child parserView is adding a child, div, under li.listclass because the next ul li in that view has a child named div figure out why
        // done fixed cssParser = todo 2014-07-21 - this works .babalon#teemyhead > .buggerfefe#hadder > td:last-child this does not #teemyhead.babalon > .buggerfefe#hadder > td:last-child  for some reason when id is first  - but seems to work when more than just one id and one class chained togehter
        // todo 2014-07-21 - getViewElement may need to return an array of of tags not just one - cuz what if there are 2 table(class="babalon") in 2 different files but only one has a tr.row
        // todo 2014-07-22 - compare.js find and replace all instances of the var viewdom and dom with viewcode
        // todo 2014-07-26 - look at compare.js cssParser() when comparing [data-dog=bucky] its assigns that value to selector. **** allattributes/selector  **** note i think its ok because .babalon#teemyhead does the same making .babalon#teemyhead the selector
        // todo 2014-07-26 - [data-section=''] > section > [data-section-title] a
        // todo 2014-07-26 -  work on cssParser() in compare.js
        // done todo 2014-07-28 - need to handle duplicate keys like having 2 selectors with same name ie if table > tr > td is listed twice in same stylesheet
        // done todo 2014-07-28 - what if you have 2 with same name that need commented make sure both get comments in fsWriter.js
        // done todo 2014-07-28 -  should not find table > .babalon > donkyko.buggerfefe#hadder but it doess
        // done todo 2014-07-30 -  should ignore attributes i cant check for yet like [class*=icon-]
        // todo 2014-07-30 - replace all links in cssParser
        // todo 2014-07-30 - writing to a dir that doesn't exist
        // todo 2014-07-30 - test more tough css test a:hover :focus etc
        // todo 2014-07-31 - compare_seiblings i had to add the first tag to match may need to do this for directChildren and others
        // done todo 2014-07-31 - codeReaderView -  init -need to count the number of tabs right now its hard code at 2
        // done todo 2014-07-31 - handle jade lines of code that continue over multi lines split with commas, maybe do a slice at end of line looking for a comma and then append the next line do that until it reaches the end

        var children_array = [];
        var current_tag_closed=false;
        for(var i in codearray){
            var code_array = codearray[i].split('\t');
            var code_tab_indents = code_array.length;  // var code_tab_indents counts the number of tabs in the current line
            //console.log('current tag = ' + codearray[current_tag_index]);
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
    getSiblings: function(codearray,current_tag_index,current_tab_indents){

        // 1) pass in all code from the view including the tabs
        // 2) split the code into an array so \t\t\tspan.someclass  will equal ['','','','span.someclass']
        // 3) conditional - compare the line# ( var i )  of the codearray loop and if its greater than the line# of the code passed into the function then check to see if their indents/tabs are equal. if they are then the
        // current_tag_index - index of the array for the html tag you are passing in
        // current_tab_indents - number of tab indents the tag has in the jade file. use this to help find the tags children

        var sibling_array = [];
        var current_tag_closed=false;
        for(var i in codearray){

            var code_array = codearray[i].split('\t');
            var code_tab_indents = code_array.length;  // var code_tab_indents counts the number of tabs in the current line of jade file
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
}
