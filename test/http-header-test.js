var assert = require('assert');
	HttpHeaderTransport = require('./../main');

describe("HTTP Header Transport", function() {
	describe("Construction Options", function() {
		it("Should have sane defaults", function(done) {
			var transport = new HttpHeaderTransport();
			transport.log('debug', 'Hello World', function(err, result) {
				assert.ifError(err);
				assert.equal(result.key, 'x-logger-0-debug');
				assert.equal(result.value, 'Hello World');
				done();
			});
		});

		it("Should emit an event", function(done) {
			var transport = new HttpHeaderTransport();
			transport.on('logged', function(result) {
				assert.equal(result.key, 'x-logger-0-debug');
				assert.equal(result.value, 'Hello World');
				done();
			});
			transport.log('debug', 'Hello World');
		});

		it("Should be silent", function(done) {
			var transport = new HttpHeaderTransport({
				silent: true
			});
			transport.log('debug', 'Hello World', function(err, result) {
				assert.ifError(err);
				assert.deepEqual(result, {});
				done();
			});
		});
	});

});