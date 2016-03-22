var assert = require('assert'),
	HttpHeaderTransport = require('./../main');

describe("HTTP Header Transport", function () {
	describe("Construction Options", function () {
		it("Should have sane defaults", function (done) {
			var transport = new HttpHeaderTransport();
			transport.log('debug', 'Hello World', function (err, result) {
				assert.ifError(err);
				assert.equal(result.key, 'x-logger-0-debug');
				assert.equal(result.value, 'Hello World');
				done();
			});
		});

		it("Should emit an event", function (done) {
			var transport = new HttpHeaderTransport();
			transport.on('logged', function (result) {
				assert.equal(result.key, 'x-logger-0-debug');
				assert.equal(result.value, 'Hello World');
				done();
			});
			transport.log('debug', 'Hello World');
		});

		it("Should be silent", function (done) {
			var transport = new HttpHeaderTransport({
				silent: true
			});
			transport.log('debug', 'Hello World', function (err, result) {
				assert.ifError(err);
				assert.deepEqual(result, {});
				done();
			});
		});

		it("Should be able to set header prefix", function (done) {
			var transport = new HttpHeaderTransport({
				headerPrefix: 'x-hippos-'
			});
			transport.log('debug', 'Hello World', function (err, result) {
				assert.ifError(err);
				assert.equal(result.key, 'x-hippos-0-debug');
				assert.equal(result.value, 'Hello World');
				done();
			});
		});
	});

	describe("Specific Id", function () {
		var mockResponse;
		beforeEach(function () {
			mockResponse = new MockResponse();
		});

		it("Should log with a specified id", function () {
			var transport = new HttpHeaderTransport({
				setHeader: mockResponse.setHeader.bind(mockResponse)
			});
			transport.log('debug', 'Hello World', {id: 'foo'});

			assert.equal(mockResponse.headers['x-logger-debug-foo'], 'Hello World');
		});

		it("Should overwrite an existing id", function () {
			var transport = new HttpHeaderTransport({
				setHeader: mockResponse.setHeader.bind(mockResponse)
			});
			transport.log('debug', 'Hello World', {id: 'foo'});
			transport.log('debug', 'Bar', {id: 'foo'});

			assert.equal(mockResponse.headers['x-logger-debug-foo'], 'Bar');
		});

		it("Should log multiple id specified keys", function () {
			var transport = new HttpHeaderTransport({
				setHeader: mockResponse.setHeader.bind(mockResponse)
			});
			transport.log('debug', 'Hello World', {id: 'foo'});
			transport.log('debug', 'Foo Bar', {id: 'bar'});

			assert.equal(mockResponse.headers['x-logger-debug-foo'], 'Hello World');
			assert.equal(mockResponse.headers['x-logger-debug-bar'], 'Foo Bar');
		});
	});

	describe("Sequential Logs", function () {
		var mockResponse;
		beforeEach(function () {
			mockResponse = new MockResponse();
		});

		it("Should log sequential logs calls in order", function () {
			var transport = new HttpHeaderTransport({
				setHeader: mockResponse.setHeader.bind(mockResponse)
			});
			transport.log('debug', 'Hello World');
			transport.log('debug', 'Foo Bar');

			assert.equal(mockResponse.headers['x-logger-0-debug'], 'Hello World');
			assert.equal(mockResponse.headers['x-logger-1-debug'], 'Foo Bar');
		});

		it("Should log sequential logs of different types in order", function () {
			var transport = new HttpHeaderTransport({
				setHeader: mockResponse.setHeader.bind(mockResponse)
			});
			transport.log('debug', 'Hello World');
			transport.log('warn', 'OMG');
			transport.log('debug', 'Nm its cool');
			assert.equal(mockResponse.headers['x-logger-0-debug'], 'Hello World');
			assert.equal(mockResponse.headers['x-logger-1-warn'], 'OMG');
			assert.equal(mockResponse.headers['x-logger-2-debug'], 'Nm its cool');
		});
	})
});

function MockResponse() {
	return {
		headers:   {},
		setHeader: function (key, value) {
			this.headers[key] = value;
		}
	}
}