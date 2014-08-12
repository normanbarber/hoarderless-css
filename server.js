var express = require('express'),
  routes = require('./config/routeProviders'),
  routesconfig = require('./config/routes');

var app = module.exports = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8000);
  app.set('views', __dirname + '/public/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

routes.setup({
  app: app,
  routes: routesconfig()
});

app.listen(app.get('port'), function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
