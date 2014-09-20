var Q = require('q');
var comparecomplex = require('../lib/compareComplex.js');
var compareselectors = require('../lib/compareSelectors.js');
var _ = require('underscore');

var compareCode = {
	start: function (selectors) {

		/*  comparing the selectors
			from the view with the selectors from
			the css and adding unused selectors to xtracss obj */

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
		var view_classes = selectors.view.selectors.classes;
		var view_ids = selectors.view.selectors.ids;
		var view_attributes = JSON.stringify(selectors.view.selectors.attributes);
		var view_code = JSON.stringify(selectors.view.selectors.viewcode);

		var all = [];
		var errordata = {};

		var promise = comparecomplex.compareComplexSelectors(css_complex_selectors, view_code)
			.then(function(css_complex_selectors){
				xtracss_complex_selectors = css_complex_selectors;
				xtracss_classes = compareselectors.getClasses(css_classes,view_classes);
			})
			.then(function(){
				xtracss_ids = compareselectors.getIds(css_ids,view_ids);
			})
			.then(function(){
				xtracss_attributes = compareselectors.getAttributes(view_code,css_attributes,view_attributes);
			})
			.then(function(){
				xtracss_tags = compareselectors.getTags(css_tags,selectors);
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
			errordata.message = 'Error thrown while comparing code';
			errordata.status = 'error';
			return Q.reject({error:errordata});
		}
	}
}
module.exports.compareCode = compareCode;
module.exports = function(selectorsobj, callback) {
	compareCode.start(selectorsobj)
		.then(function(code){
			return callback(null, code);
		})
		.fail(function(err) {
			return callback(err, null);
		});
};

