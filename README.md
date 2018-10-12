# Express Influx Logger

Express Influx Logger is an express.js middleware used to automatically log requests' path, method, start time, execution time, and response status code.


## Installation

```
	npm install --save express-influx-logger
```

## Usage

In your express application, use it as a middleware

```js
	const app = require('express')();
	const expressInfluxLogger = require('express-influx-logger');

	app.use(expressInfluxLogger())
```

You can also pass the middleware some option variables

```js
	const middlewareOptions = {
		host: 'example.com',
		port: 8088,
		username: 'admin-user',
		password: 'secret-password',
		database: 'example-influx-database',
		protocol: 'http'
	};
	app.use(expressInfluxLogger(middlewareOptions))
```

The middleware will connect to influx database and create the database automatically if needed.
Middleware will throw an error if it is unable to fetch or create the database at initialization

## Structure
express-influx-logger will write a new measurement after each response and will have the following schema:
```
	time: InfluxDB timestamp in nanoseconds
	duration: Time it took to respond to the request in milliseconds
	method: HTTP method used (GET, POST, etc...)
	responseStatus: Status code sent in response
	startTime: JS timestamp when the request was received by server in milliseconds
	url: URL of the request handled
```