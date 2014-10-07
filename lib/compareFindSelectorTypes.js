module.exports = {
	/*  takes a line of code from view
		returns ids and classes
		from that line */
	findIds: function(attribute){
		var view_ids = attribute.match(/id="(.*?)"/gi);
		var ids = view_ids.toString().replace(/id="|"/gi,"");
		return ids;
	},
	findClasses: function(attribute){
		var view_classes = attribute.match(/class="(.*?)"/gi);
		var classes = view_classes.toString().replace(/class="|"/gi,"");
		return classes;
	},
	findNGClasses: function(code){
		var ngclassarray=[];

		var ngclassmatch = code.match(/([a-z]+-)?ng-class([-a-z]+)?="+\{?(.*)\}?"+,?|([a-z]+:)?ng:class([:a-z]+)?="+\{?(.*)\}?"+,?/gi);
		if(ngclassmatch){
			for(var ngindex in ngclassmatch){
				var ngclassreplace = ngclassmatch[ngindex].replace(/([a-z]+-)?ng-class([-a-z]+)?=/gi,"").replace(/([a-z]+:)?ng:class([:a-z]+)?=/gi,"");
				ngclassreplace = ngclassreplace.slice(1,-1);
				var ngclass = ngclassreplace.match(/"+(.*?)"+/g);

				if(!ngclass){
					var matchclassAlt = ngclassreplace.replace(/\./g,"").replace(/[^\sa-z0-9_]+/gi,"").split(' ');
					for(var matchindex in matchclassAlt){
						var matchclass = matchclassAlt[matchindex].replace(/"/g,"");
						ngclassarray.push(matchclass);
					}
				}else if(ngclass){
					for(var matchindex in ngclass){
						var matchclass = ngclass[matchindex].replace(/"/g,"");
						ngclassarray.push(matchclass);
					}
				}

			}
		}
		return ngclassarray;
	}
}

