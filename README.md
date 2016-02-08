WinstonJS Transport: HTTP Headers
=================================

A WinstonJS transport that logs to HTTP headers, useful for sending profiling data to the browser that doesn't muddle the response body.

Master Build Status:
[![Build Status](https://travis-ci.org/aerisweather/winstonjs-transport-http-headers.svg?branch=master)](https://travis-ci.org/aerisweather/winstonjs-transport-http-headers)
[![Coverage Status](https://coveralls.io/repos/aerisweather/winstonjs-transport-http-headers/badge.svg?branch=master&service=github)](https://coveralls.io/github/aerisweather/winstonjs-transport-http-headers?branch=master)

__This project sponsored by:__

[![AerisWeather](http://branding.aerisweather.com/logo-dark-small.png)](http://www.aerisweather.com) - Empowering the next generation, [aerisweather.com](https://www.aerisweather.com)

Installation
------------

This project is available on npm:

```sh
npm install --save winstonjs-transport-http-headers
```

Example
-------

**Note:** A full example can be found in `example.js` which integrates an ExpressJS HTTP Server

The logger should be added to the response, probably in middleware:

```javascript
// Middleware example to setup our logger.
app.use(function(req, res, next) {
    res.logger = new (winston.Logger)({
        transports: [
            // Here is our new logger
            new HttpHeaderTransport({
                setHeader: res.set.bind(res),
                level: 'debug'
            }),
            // We can use the HTTP Header logger in combination with other loggers too.
            new (winston.transports.Console)({
                level: 'warn'
            })
        ],
        //Setup Levels for this logger
        levels:     {
            warn: 4,
            info: 6,
            debug: 7
        }
    });
    next();
});
```

Then in an action, we can log something to the response:
```javascript
// Will log to a header: `x-logger-0-debug`
res.logger.log('debug', 'Basic Log Message');

// Will log to both a header and the console (as defined above)
res.logger.log('warn', 'Uh oh');
```

Docs
----

### new HttpHeaders(options)

| Param        | Type       | Default       | Description                                                               |
| ------------ | ---------- | ------------- | ------------------------------------------------------------------------- |
| setHeader    | `function` |               | A callable (key, value) that will set the header to the request. |
| silent       | `boolean`  | `false`       | If enabled, logger will not log to HTTP Header, will not emit events. |
| level        | `level`    | `"debug"`     | What level this logger should respond to, see Winston docs for more info. |
| headerPrefix | `string`   | `"X-Logger-"` | A callable that provides a string that is prepended to each header. |
| getHeaderId  | `function` | `(default)`   | A callable that gets a header ID based on passed options. |
| cleanId      | `function` | `(default)`   | Cleans a string into a nice HTTP friendly header ID. |