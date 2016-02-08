// HTTP Logger Section
var WinstonTransport = require('winston').Transport,
	util = require('util');

var HttpHeaderTransport = function (options) {
	WinstonTransport.call(this, options);
	options = options || {};
	this.silent = (options.silent !== undefined) ? options.silent : false;
	this.level = options.level || 'debug';

	this.getHeaderId = options.getHeaderId || getHeaderPrefix;
	this.cleanId = options.cleanId || cleanSpacesCamelCase;
	this.setHeader = options.setHeader || function (name, value) {
		};

	this.counter = 0;
};
util.inherits(HttpHeaderTransport, WinstonTransport);

HttpHeaderTransport.prototype.log = function (level, msg, data, callback) {
	if(data instanceof Function) {
		callback = data;
		data = undefined;
	}

	if (this.silent) {
		return callback(null, {});
	}

	var id;
	if(data && data.durationMs) {
		// Special case for logger.profile style timing methods.
		id = this.cleanId(this.getHeaderId(level, msg));
		this.setHeader(id, data.durationMs/1000);
	}
	else if (data && data.id) {
		// Set header based on a user specified id.
		id = this.cleanId(this.getHeaderId(level, data.id));
		this.setHeader(id, msg);
	}
	else {
		// No id specified, create a unique one.
		id = this.cleanId(this.getHeaderId(this.getNextId(), level));
		this.setHeader(id, msg);
	}

	var result = {key: id, value: msg};
	this.emit('logged', result);
	if(callback) {
		return callback(null, result);
	}
};

HttpHeaderTransport.prototype.getNextId = function () {
	var nextId = this.counter;
	this.counter++;
	return nextId;
};

HttpHeaderTransport.prototype.name = 'httpHeaders';

function getHeaderPrefix(a, b) {
	return 'X-Logger-' + a + '-' + b;
}

function cleanSpacesCamelCase(str) {
	return str.replace(/[^a-zA-Z0-9]/, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

module.exports = HttpHeaderTransport;