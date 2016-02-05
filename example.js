var express = require('express');
var app = express();

var winston = require('winston');
//**** Change below to your require
var HttpHeaderTransport = require('./main');

app.get('/', function (req, res) {
	res.logger = new (winston.Logger)({
		transports: [
			new HttpHeaderTransport({
				setHeader: res.set.bind(res),
				level: 'profile'
			}),
			new (winston.transports.Console)({
				level: 'warn'
			})
		],
		levels:     {
			warn: 4,
			profile: 8
		}
	});

	res.logger.log('profile', 'Basic Log Message');
	res.logger.log('profile', 5.96168, {id: 'parse-duration'});
	res.logger.log('profile', 'Another Log Message');
	res.logger.log('warn', 'Severe so logged to console too.');

	res.logger.profile('rendering');
	setTimeout(function () {
		res.logger.profile('rendering');
		res.send('Hello World!<br/>(Check the response headers for your logged info.)');
	});
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});