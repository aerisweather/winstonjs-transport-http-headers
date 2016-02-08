var assert = require('assert'),
	express = require('express'),
	HttpHeaderTransport = require('./../main'),
	nock = require('nock'),
	request = require('supertest'),
	sinon = require('sinon'),
	winston = require('winston');

describe("Integration with Express", function () {

	var app,
		clock;
	beforeEach(function () {
		nock.disableNetConnect();
		nock.enableNetConnect('127.0.0.1');

		app = express();
		app.use(function (req, res, next) {
			res.logger = new (winston.Logger)({
				transports: [
					new HttpHeaderTransport({
						setHeader: res.set.bind(res),
						level:     'debug'
					}),
					new (winston.transports.Console)({
						level: 'warn'
					})
				],
				levels:     {
					warn:  4,
					info:  6,
					debug: 7
				}
			});
			next();
		});

		clock = sinon.useFakeTimers(Date.now());
	});

	afterEach(function () {
		nock.cleanAll();
		nock.enableNetConnect();
		clock.restore();
	});

	describe("Log", function () {

		it("Should log a basic message", function (done) {
			app.get('/', function (req, res) {
				res.logger.log('debug', 'Hello World');
				res.send({foo: 'bar'});
			});

			request(app)
				.get('/')
				.expect(function (res) {
					assert.equal(res.headers['x-logger-0-debug'], 'Hello World');
				})
				.end(done);
		});

		it("Should log a 'profile' request", function (done) {
			app.get('/', function (req, res) {
				res.logger.log('debug', 'Hello World');
				res.logger.profile('rendering');
				clock.tick(1000);
				res.logger.profile('rendering', {}, function (err, logResult) {
					res.send('Hello World!<br/>(Check the response headers for your logged info.)');
				});
			});

			request(app)
				.get('/')
				.expect(function (res) {
					assert.equal(res.headers['x-logger-0-debug'], 'Hello World');
					assert.ok(parseInt(res.headers['x-logger-info-rendering']) >= 1);
				})
				.end(done);
		});

	});

});