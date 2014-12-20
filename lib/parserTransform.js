var _ = require('underscore');
module.exports = {
	transformObject: function(viewcode){
		var transform;
		_.each(viewcode, function(code){
			transform = _.each(code.dom, function(tag){
				return tag;
			})
		})
		return transform;
	}
}

