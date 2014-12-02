var Q = require('q');
var comparecomplex = require('../lib/compareComplex.js');
var compareselectors = require('../lib/compareSelectors.js');
var _ = require('underscore');

var compareCode = {
	start: function (data) {

		/*  comparing the data
			from the view with the data from
			the css and returning object with unused selectors */

		var selectors = {
			css: {},
			view: {}
		};

		var all = [];
		var errordata = {};

		var promise = comparecomplex.getComplexSelectors(data.css.selectors.complexselectors, JSON.stringify(data.view.selectors.viewcode))
			.then(function(complex){
				selectors.css.advanced = complex;
				selectors.css.classes = compareselectors.getClasses(data.css.selectors.classes,data.view.selectors.classes);
			})
			.then(function(){
				selectors.css.ids = compareselectors.getIds(data.css.selectors.ids,data.view.selectors.ids);
			})
			.then(function(){
				selectors.css.attributes = compareselectors.getAttributes(JSON.stringify(data.view.selectors.viewcode),data.css.selectors.attributes,JSON.stringify(data.view.selectors.attributes));
			})
			.then(function(){
				selectors.css.tags = compareselectors.getTags(data.css.selectors.tags,data);
			})
			.then(function(){
				return selectors.css;
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
module.exports = function(selectorsobj,callback) {
	compareCode.start(selectorsobj)
		.then(function(code){
			return callback(null, code);
		})
		.fail(function(err) {
			return callback(err, null);
		});
};

