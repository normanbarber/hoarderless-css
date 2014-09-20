var _ = require('underscore');
var path = require('path');

exports.setup = function(params) {
  var app = params.app, routes = params.routes;
	_.each(routes, function(route) { 

		app[route.method](
			route.route,
			function() {
				if (route.render) {
				  return function(req, res) {
					  res.render(path.normalize(route.render.template));
				  }
				}

				if (route.handler) {
				  return function(req, res) {
					var provider = require('../lib/' + route.handler.module);
					provider.services[route.handler.method](req, res);
			 
				  }
				}
			}()
		);
	});
};
