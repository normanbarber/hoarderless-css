var express = require('express');
var path = require('path');
var http = require('http');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var multer = require('multer');
var routes = require('./config/routeProviders');
var routesconfig = require('./config/routes');

var app = express();

app.set('port', process.env.PORT || 8000);
app.set('views', path.join(__dirname, '/public/views'));
app.set('view engine', 'jade');
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(express.static(path.join(__dirname, 'public')));


routes.setup({
  app: app,
  routes: routesconfig()
});

app.listen(app.get('port'), function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
