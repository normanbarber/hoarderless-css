
module.exports = {
	findIds: function(attribute){
		var view_attribute_ids = attribute.match(/id="(.*?)"/gm);
		var rep_view_attribute_ids = view_attribute_ids.toString().replace(/id="|"/g,"");
		return rep_view_attribute_ids;
	},
	findClasses: function(attribute){
		var view_attribute_classes = attribute.match(/class="(.*?)"/gm);
		var rep_view_attribute_classes = view_attribute_classes.toString().replace(/class="|"/g,"");
		return rep_view_attribute_classes;
	}
}

