#!/usr/bin/env node
var codereader = require('../lib/codeReaderMain');
var codewriter = require('../lib/codeWriterMain');
var comparecode = require('../lib/compare');
var codereaderview = require('../lib/codeReaderView');
var codereadercss = require('../lib/codeReaderCss');

var args = process.argv.slice(2);

if (args.length != 2) {
    throw new Error('two argument must be specified (the path to your view files and the path your css files)');
}
module.exports.compare = compare = {
    services: {
        'selectors': {},
        'readhtml': function(viewpath,csspath) {
            var readviewdirectory = viewpath;
            var self = this;
            var fileformat = '.jade';
            codereader(readviewdirectory, fileformat, codereaderview, function(err, code) {
                self.selectors.view = code;
                self.readcss(csspath);
            });
        },
        'readcss': function(csspath) {
            var readcssdirectory = csspath;
            var self = this;
            var fileformat = '.css';
            self.cssdirectory = readcssdirectory;
            codereader(readcssdirectory, fileformat, codereadercss, function(err, code) {
                self.selectors.css = code;
                self.getresults();
            });
        },
        'getresults': function(){
            var self = this;
            comparecode(this.selectors, function(err, code) {
                self.selectors.unused = code[0];
                self.cleancode();
            });
        },
        'cleancode': function(){
            var self = this;
            var fileformat = '.css';
            codewriter(self.cssdirectory, fileformat, this.selectors, function(err, code) {
                self.selectors.cleancss = code;
            });

        }
    }
};
compare.services.readhtml(args[0],args[1]);
