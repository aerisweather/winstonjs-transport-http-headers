const assert = require('assert'),
    HttpHeaderTransport = require('./../main');

describe("HTTP Header Transport", function () {
    describe("Construction Options", function () {
        it("Should have sane defaults", function (done) {
            const transport = new HttpHeaderTransport();
            transport.log({level: 'debug', message: 'Hello World'}, function (err, result) {
                assert.ifError(err);
                assert.strictEqual(result.key, 'x-logger-0-debug');
                assert.strictEqual(result.value, 'Hello World');
                done();
            });
        });

        it("Should emit an event", function (done) {
            var transport = new HttpHeaderTransport();
            transport.on('logged', function (result) {
                assert.strictEqual(result.key, 'x-logger-0-debug');
                assert.strictEqual(result.value, 'Hello World');
                done();
            });
            transport.log({level: 'debug', message: 'Hello World'});
        });

        it("Should be able to set header prefix", function (done) {
            var transport = new HttpHeaderTransport({
                headerPrefix: 'x-hippos-'
            });
            transport.log({level: 'debug', message: 'Hello World'}, function (err, result) {
                assert.ifError(err);
                assert.strictEqual(result.key, 'x-hippos-0-debug');
                assert.strictEqual(result.value, 'Hello World');
                done();
            });
        });
    });

    describe("Specific Id", function () {
        let mockResponse;
        beforeEach(function () {
            mockResponse = new MockResponse();
        });

        it("Should log with a specified id", function () {
            let transport = new HttpHeaderTransport({
                setHeader: mockResponse.setHeader.bind(mockResponse)
            });
            transport.log({level: 'debug', message: 'Hello World', id: 'foo'});

            assert.strictEqual(mockResponse.headers['x-logger-debug-foo'], 'Hello World');
        });

        it("Should overwrite an existing id", function () {
            var transport = new HttpHeaderTransport({
                setHeader: mockResponse.setHeader.bind(mockResponse)
            });
            transport.log({level: 'debug', message: 'Hello World', id: 'foo'});
            transport.log({level: 'debug', message: 'Bar', id: 'foo'});

            assert.strictEqual(mockResponse.headers['x-logger-debug-foo'], 'Bar');
        });

        it("Should log multiple id specified keys", function () {
            var transport = new HttpHeaderTransport({
                setHeader: mockResponse.setHeader.bind(mockResponse)
            });
            transport.log({level: 'debug', message: 'Hello World', id: 'foo'});
            transport.log({level: 'debug', message: 'Foo Bar', id: 'bar'});

            assert.strictEqual(mockResponse.headers['x-logger-debug-foo'], 'Hello World');
            assert.strictEqual(mockResponse.headers['x-logger-debug-bar'], 'Foo Bar');
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
            transport.log({level: 'debug', message: 'Hello World'});
            transport.log({level: 'debug', message: 'Foo Bar'});

            assert.strictEqual(mockResponse.headers['x-logger-0-debug'], 'Hello World');
            assert.strictEqual(mockResponse.headers['x-logger-1-debug'], 'Foo Bar');
        });

        it("Should log sequential logs of different types in order", function () {
            var transport = new HttpHeaderTransport({
                setHeader: mockResponse.setHeader.bind(mockResponse)
            });
            transport.log({level:'debug', message: 'Hello World'});
            transport.log({level:'warn', message: 'OMG'});
            transport.log({level:'debug', message: 'Nm its cool'});
            assert.strictEqual(mockResponse.headers['x-logger-0-debug'], 'Hello World');
            assert.strictEqual(mockResponse.headers['x-logger-1-warn'], 'OMG');
            assert.strictEqual(mockResponse.headers['x-logger-2-debug'], 'Nm its cool');
        });
    })
});

function MockResponse() {
    return {
        headers: {},
        setHeader: function (key, value) {
            this.headers[key] = value;
        }
    }
}