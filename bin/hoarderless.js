#!/usr/bin/env node

var codewriter = require('../lib/codeWriterMain');
var comparecode = require('../lib/compareCodeMain');
var cmdjson = require('commandjson');
var commander = require('commander');
var Q = require('q');

commander
    .version('0.0.1')
    .option('-t, --viewtype [value]', 'a string for view type (html)')
    .option('-v, --viewpath [value]', 'a string for view folder path (/path/to/your/views/folder)')
    .option('-s, --stylepath [value]', 'a string for stylesheet folder path (/path/to/your/css/folder)')
    .parse(process.argv);

commander.parse(process.argv);

module.exports.compare = compare = {
	services: {
		'selectors': {},
		'readview': function() {
            console.log('----- reading view files');
            var self = this;
            var file = {};
            file.type = commander.viewtype;
            file.paths = commander.viewpath;

            var readcssdirectory = commander.stylepath;

	        return cmdjson.getFiles(file)
			    .then(function(code){
                     self.selectors.view = code[0];
                     self.readcss(commander.stylepath);
				})
                .fail(function(error) {
                     return error;
                });
		},
		'readcss': function(csspath) {
            console.log('----- reading css files');
			var self = this;
			self.cssdirectory = csspath;

            var file = {};
            var fileformat;
            file.type = '.css';
            file.paths = csspath;

            return cmdjson.getFiles(file)
                .then(function(code){

                    self.selectors.css = code[0];
                    self.compare();
                })
                .fail(function(error) {
                    return error;
                })
		},
		'compare': function(){
            console.log('----- comparing selectors in view with selectors in css');
			var self = this;

            comparecode(this.selectors, function(err, code) {
				self.selectors.unused = code;
				self.cleancode();
			});
		},
		'cleancode': function(){
            console.log('----- writing cleancode');
			var self = this;
			var fileformat = '.css';
            codewriter(self.cssdirectory, fileformat, this.selectors);
		}
	}
};
compare.services.readview();
