// HTTP Logger Section
var WinstonTransport = require('winston').Transport,
	util = require('util');

/**
 * An HTTP Header Transport - Logs messages to HTTP Headers
 *
 *
 * @param {{}} options
 * @param {boolean} [options.silent=false] - If enabled, logger will not log to HTTP Header, will not emit events.
 * @param {level} [options.level='debug'] - What level this logger should respond to, see Winston docs for more info.
 * @param {string} [options.headerPrefix='X-Logger-'] - A string that is prepended to each header.
 * @param {getHeaderPrefix} [options.getHeaderId] - Gets a header ID based on passed options.
 * @param {function} [options.cleanId] - Cleans a string into a nice HTTP friendly header ID.
 * @param {setHeader} options.setHeader - A callable (key, value) that will set the header to the request.
 * @constructor
 */
var HttpHeaderTransport = function (options) {
	WinstonTransport.call(this, options);
	options = options || {};
	this.silent = (options.silent !== undefined) ? options.silent : false;
	this.level = options.level || 'debug';

	this.headerPrefix = options.headerPrefix || 'X-Logger-';
	this.getHeaderId = options.getHeaderId || this.getHeaderPrefix;
	this.cleanId = options.cleanId || cleanSpacesCamelCase;
	this.setHeader = options.setHeader || function (name, value) {
		};

	this.counter = 0;
};
util.inherits(HttpHeaderTransport, WinstonTransport);

/**
 * The main function to log a message or data to this transport.
 * 1) Use winston.profile([id]) to log a time with 'id' as the header (+ prefix stuff)
 * 2) Pass an id via data.id to log a header with 'id' as the header (+ prefix stuff)
 * 3) Just log a level and a message to have the header auto created via auto-increment id.
 *
 * @param {string} level
 * @param {string} msg
 * @param {{durationMs,id}|function} [data]
 * @param {function} [callback]
 * @returns {*}
 */
HttpHeaderTransport.prototype.log = function (level, msg, data, callback) {
	if (data instanceof Function) {
		callback = data;
		data = undefined;
	}

	if (this.silent) {
		return callback(null, {});
	}

	var id;
	if (data && data.durationMs) {
		// Special case for logger.profile style timing methods.
		id = this.cleanId(this.getHeaderId({
			level:  level,
			userId: msg
		}));
		this.setHeader(id, data.durationMs / 1000);
	}
	else if (data && data.id) {
		// Set header based on a user specified id.
		id = this.cleanId(this.getHeaderId({
			level:  level,
			userId: data.id
		}));
		this.setHeader(id, msg);
	}
	else {
		// No id specified, create a unique one.
		id = this.cleanId(this.getHeaderId({
			level:  level,
			autoId: this.getNextId()
		}));
		this.setHeader(id, msg);
	}

	var result = {key: id, value: msg};
	this.emit('logged', result);
	if (callback) {
		return callback(null, result);
	}
};

/**
 * Gets the next sequential ID for this logger.
 * @returns {number}
 */
HttpHeaderTransport.prototype.getNextId = function () {
	var nextId = this.counter;
	this.counter++;
	return nextId;
};

/**
 * The name used by Winston to reference this logger
 * @type {string}
 */
HttpHeaderTransport.prototype.name = 'httpHeaders';

/**
 * Gets a header ID prefix based on the supplied options.
 *
 * @param {{}} options - The information needed to return a prefix.
 * @param {string} options.level - The log level of the message
 * @param {string} [options.userId] - The user specified ID for this header
 * @param {string} [options.autoId] - The auto increment ID that was used to generate this header name.
 * @returns {string}
 */
HttpHeaderTransport.prototype.getHeaderPrefix = function (options) {
	if (options.autoId !== undefined) {
		// Put autoId first since headers get sorted (in Chrome or Express?)
		return this.headerPrefix + options.autoId + '-' + options.level;
	}
	else if (options.userId !== undefined) {
		return this.headerPrefix + options.level + '-' + options.userId;
	}
};

/**
 * Turns space and camelcase delimited string into - (hyphen) delimited.
 * @param str
 * @returns {string} - Now hyphen delimited
 */
function cleanSpacesCamelCase(str) {
	return str.replace(/[^a-zA-Z0-9]/, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

module.exports = HttpHeaderTransport;

/**
 * Compose a header prefix based on the passed options.
 *
 * @callback httpHeaderTransport~getHeaderPrefix
 * @param {{}} options - The information needed to return a prefix.
 * @param {string} options.level - The log level of the message
 * @param {string} [options.userId] - The user specified ID for this header
 * @param {string} [options.autoId] - The auto increment ID that was used to generate this header name.
 */

/**
 * Compose a header prefix based on the passed options.
 *
 * @callback httpHeaderTransport~setHeader
 * @param {string} key - The headerId, should start with an 'X' and be '-' (hyphen) delimited
 * @param {string} value - The header value, the log message.
 */