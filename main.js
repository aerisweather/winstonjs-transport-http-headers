// HTTP Logger Section
const Transport = require('winston-transport'),
    util = require('util');


module.exports = class HttpHeaderTransport extends Transport {
    /**
     * An HTTP Header Transport - Logs messages to HTTP Headers
     *
     *
     * @param {{}} [options]
     * @param {string} [options.headerPrefix='X-Logger-'] - A string that is prepended to each header.
     * @param {getHeaderPrefix} [options.getHeaderId] - Gets a header ID based on passed options.
     * @param {function} [options.cleanId] - Cleans a string into a nice HTTP friendly header ID.
     * @param {setHeader} options.setHeader - A callable (key, value) that will set the header to the request.
     * @constructor
     */
    constructor(options) {
        options = (options === undefined) ? {} : options;
        super(options);

        this.headerPrefix = options.headerPrefix || 'X-Logger-';
        this.getHeaderId = options.getHeaderId || this.getHeaderPrefix;
        this.cleanId = options.cleanId || cleanSpacesCamelCase;
        this.setHeader = options.setHeader || function (name, value) {};

        this.counter = 0;
    }

    /**
     * The main function to log a message or data to this transport.
     * 1) Use winston.profile([id]) to log a time with 'id' as the header (+ prefix stuff)
     * 2) Pass an id to log a header with 'id' as the header (+ prefix stuff)
     * 3) Just log a level and a message to have the header auto created via auto-increment id.
     *
     * @param {{}} info
     * @param {string} info.level
     * @param {string} info.message
     * @param {number} [info.durationMs]
     * @param {string} [info.id]
     * @param {function} [callback]
     * @returns {*}
     */
    log(info, callback) {
        try {
            let id;
            if (info.durationMs !== undefined) {
                // Special case for logger.profile style timing methods.
                id = this.cleanId(this.getHeaderId({
                    level: info.level,
                    userId: info.message
                }));
                this.setHeader(id, info.durationMs / 1000);
            } else if (info.id && info.id && info.id) {
                // Set header based on a user specified id.
                id = this.cleanId(this.getHeaderId({
                    level: info.level,
                    userId: info.id
                }));
                this.setHeader(id, info.message);
            } else {
                // No id specified, create a unique one.
                id = this.cleanId(this.getHeaderId({
                    level: info.level,
                    autoId: this.getNextId()
                }));
                this.setHeader(id, info.message);
            }

            const result = {key: id, value: info.message};
            this.emit('logged', result);
            if (callback) {
                return callback(null, result);
            }
        } catch (err) {
            // Error in our logger, puke it out, we have nowhere else to put it!
            return callback(err);
        }
    }

    /**
     * Gets a header ID prefix based on the supplied options.
     *
     * @param {{}} options - The information needed to return a prefix.
     * @param {string} options.level - The log level of the message
     * @param {string} [options.userId] - The user specified ID for this header
     * @param {string} [options.autoId] - The auto increment ID that was used to generate this header name.
     * @returns {string}
     */
    getHeaderPrefix(options) {
        if (options.autoId !== undefined) {
            // Put autoId first since headers get sorted (in Chrome or Express?)
            return this.headerPrefix + options.autoId + '-' + options.level;
        } else if (options.userId !== undefined) {
            return this.headerPrefix + options.level + '-' + options.userId;
        }
    };

    /**
     * Gets the next sequential ID for this logger.
     * @returns {number}
     */
    getNextId() {
        let nextId = this.counter;
        this.counter++;
        return nextId;
    };


};

/**
 * Turns space and camelcase delimited string into - (hyphen) delimited.
 * @param str
 * @returns {string} - Now hyphen delimited
 */
function cleanSpacesCamelCase(str) {
    return str.replace(/[^a-zA-Z0-9]/, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

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