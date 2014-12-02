var codewriter = require('../lib/codeWriterMain');
var comparecode = require('../lib/compareCodeMain');
var cmdjson = require('commandjson');
var Q = require('q');

module.exports = {
	services: {
		'selectors': {},
		'readhtml': function(req, res) {
			var self = this;
			var readviewdirectory = req.body.readhtml;
			var file = {};
			var fileformat;
			file.type = req.body.viewtype;
			file.paths = readviewdirectory;

			 return cmdjson.getFiles(file)
				.then(function(code){
					self.selectors.view = code[0];
					res.send(code[0]);
				})
				.fail(function(err){
					res.send(err.exception);
				});
		},
		'readcss': function(req, res) {

			var readcssdirectory = req.body.readcss;
			var self = this;
			self.cssdirectory = readcssdirectory;

			var file = {};
			var fileformat;
			file.type = 'css';
			file.paths = readcssdirectory;

			 return cmdjson.getFiles(file)
				.then(function(code){
					console.log('readcssdirectory');
					console.log(code);
					self.selectors.css = code[0];
					res.send(code[0]);
				})	
				.fail(function(err){
					res.send(err[0]);
				});
		},
		'getresults': function(req, res){
			var self = this;
			comparecode(this.selectors, function(err, code) {
				self.selectors.unused = code[0];
				if (!err){
					res.send(code[0]);
				}
				else res.send(err);
			});
		},
		'cleancode': function(){
			var self = this;
			var fileformat = '.css';
			codewriter(self.cssdirectory, fileformat, this.selectors);
		}
	}
};
