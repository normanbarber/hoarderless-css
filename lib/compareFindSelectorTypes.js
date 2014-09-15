module.exports = {
	/*  takes a line of code from view
		returns ids and classes
		from that line */
	findIds: function(attribute){
		var view_ids = attribute.match(/id="(.*?)"/gm);
		var ids = view_ids.toString().replace(/id="|"/g,"");
		return ids;
	},
	findClasses: function(attribute){
		var view_classes = attribute.match(/class="(.*?)"/gm);
		var classes = view_classes.toString().replace(/class="|"/g,"");
		return classes;
	},
    findNGClasses: function(code){
        var ngclassarray=[];
        code = code.replace(/\s*=\s*/g,"=");
        var ngclassmatch = code.match(/([a-z]+-)?ng-class([-a-z]+)?="+\{?(.*)\}?"+,?|([a-z]+:)?ng:class([:a-z]+)?="+\{?(.*)\}?"+,?/g);
        if(ngclassmatch){
            for(var ngindex in ngclassmatch){
                var ngclassreplace = ngclassmatch[ngindex].replace(/([a-z]+-)?ng-class([-a-z]+)?=/g,"").replace(/([a-z]+:)?ng:class([:a-z]+)?=/g,"");
                ngclassreplace = ngclassreplace.slice(1,-1);
                var ngclass = ngclassreplace.match(/"+(.*?)"+/g);
                for(var matchindex in ngclass){
                    var matchclass = ngclass[matchindex].replace(/"/g,"");
                    ngclassarray.push(matchclass);
                }
            }
        }
        return ngclassarray;
    }
}

