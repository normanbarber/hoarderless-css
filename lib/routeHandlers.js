var codereader = require('../lib/codeReaderMain');
var codewriter = require('../lib/codeWriterMain');
var comparecode = require('../lib/compareCodeMain');
var codereaderview = require('../lib/codeReaderView');
var codereadercss = require('../lib/codeReaderCss');
var jade = require('jade');
var fs = require('fs');
module.exports = {
	/*  these get everything cooking  */
	services: {
		'selectors': {},
		'readhtml': function(req, res) {
			var readviewdirectory = req.body.readhtml;
			var self = this;
			var fileformat = req.body.viewtype;
			codereader(readviewdirectory, fileformat, codereaderview, function(err, code) {
				self.selectors.view = code;
				if (!err) res.send(code);
				else res.send(err);
			});
		},
		'readcss': function(req, res) {
			var readcssdirectory = req.body.readcss;
			var self = this;
			var fileformat = '.css';
			self.cssdirectory = readcssdirectory;
			codereader(readcssdirectory, fileformat, codereadercss, function(err, code) {
				self.selectors.css = code;
				if (!err) res.send(code);
				else res.send(err);
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
