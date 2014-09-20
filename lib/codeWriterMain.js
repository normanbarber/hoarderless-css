var fswriter = require('../lib/fsWriter');

module.exports = function(dirpath, fileformat, selectors) {
	/*  self explanitory  */
	fswriter.services['rewriteFile'](dirpath,selectors)
};

