const influx = require('influx');
const onFinished = require('on-finished');
const moment = require('moment');

/**
 * @param {Object} middlewareOptions
 * @param {string} middlewareOptions.host - InfluxDB host. Defaults to localhost
 * @param {string} middlewareOptions.protocol - InfluxDB protocol. Either 'http' or 'https'. Defaults to http
 * @param {number} middlewareOptions.port - InfluxDB port. Integer value. Defaults to 8086
 * @param {string} middlewareOptions.database - InfluxDB database used for logging. Defaults to 'express-influx-logs'
 * @param {string} middlewareOptions.username - InfluxDB username. Defaults to undefined. No username set
 * @param {string} middlewareOptions.password - InfluxDB password. Defaults to undefined. No password set
 */
module.exports = (middlewareOptions = {}) => {
	// Destruct influxDB options
	let { host, port, database = 'express-influx-logs',
			 username, password, protocol, options, pool } = middlewareOptions;
	
	// Configuring influxDB
	const db = new influx.InfluxDB({
		database, host, port, username, password, protocol, options, pool,
		schema: [
			{
				measurement: 'response_time',
				fields: {
					startTime: influx.FieldType.INTEGER,
					duration: influx.FieldType.INTEGER,
					responseStatus: influx.FieldType.INTEGER
				},
				tags: ['url', 'method']
			},
			{
				measurement: 'errors',
				fields: {
					name: influx.FieldType.STRING,
					message: influx.FieldType.STRING
				},
				tags: []
			}
		]
	})

	// Express middleware
	return function(req, res, next){
		req.__INFLUX_MIDDLEWARE_START_TIME__ = moment();
		onFinished(res, function(err){
			if(err){
				return db.writeMeasurement('errors', [{
					fields: {
						name: err.name,
						message: err.message
					}
				}])
			}
			let difference = moment().diff(req.__INFLUX_MIDDLEWARE_START_TIME__, 'ms');
			db.writeMeasurement('response_time', [{
				fields: {
					startTime: req.__INFLUX_MIDDLEWARE_START_TIME__.valueOf(),
					duration: difference,
					responseStatus: res.statusCode
				},
				tags: {
					url: req.originalUrl,
					method: req.method
				}
			}])
		})
		next()
	}
}