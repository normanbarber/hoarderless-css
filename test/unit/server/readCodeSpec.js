var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon'),
	sandbox = require('sandboxed-module'),
	Q = require('q');

chai.use(require('sinon-chai'));

describe('Compare View/CSS Code', function() {
	process.setMaxListeners(0);	// avoid Q promise library warning

	var env = {};

	beforeEach(function() {
		env.codesync = [{
			code: [{
				content:'',
				format: '.html',
				name: 'somefile.html'
			}],
			filenames: ['somefile.html'],
			selectors: {
				classes: ['somespanclass','someclass','oneclass'],
				ids: ['container', 'somespan','someid' ],
				attributes: ['lang="en"','type="input"','class="somespanclass"','class="somespan"','class="oneclass"','id="container"','id="somespan"','id="someid"' ],
				viewcode: [{dom:{}}]
			}
		}];
		env.error = [{
			exception: {
				error: 'invalid path'
			}
		}];

		env.req = {
			body: {
				readhtml: '../mocks/views/examples',
				readcss: '../mocks/css/examples',
				viewtype: 'html'
			}
		};
		env.res = {
			send: sinon.stub()
		};
		env.res.send.returns(Q(env.codesync[0]));

		env.req.error = {
			body: {
				readhtml: 'path/that/does/not/exist',
				readcss: 'path/that/does/not/exist',
				viewtype: 'html'
			}
		};
		env.res.error = {
			send: sinon.stub()
		};
		env.res.error.send.returns(Q(env.error[0]));


		env.commandjson = {
			getFiles: sinon.stub()
		};
		env.commandjson.getFiles.returns(Q(env.codesync));

		env.fsReader = {
			processDir: sinon.stub(),
			processFiles: sinon.stub()
		};
		env.main = sandbox.require('../../../lib/main', {
			requires: {
				'commandjson': env.commandjson,
			}
		});
	});

	describe('Testing Main Module lib/main.js', function() {

		describe('testing readhtml call with valid path', function() {
			beforeEach(function() {
				env.main.services.readhtml(env.req, env.res);
			});

			it('should expect the required commandjson module to be called one time', function() {
				expect(env.commandjson.getFiles).to.have.been.calledOnce;
			});
		});

		describe('testing readhtml call with invalid path', function() {
			beforeEach(function() {
				env.main.services.readhtml(env.req.error, env.res.error);
			});

			it('should expect the required commandjson module to be called one time', function() {
				expect(env.commandjson.getFiles).to.have.been.calledOnce;
			});
		});
	});
});

