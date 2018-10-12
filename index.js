const influx = require('influx');
const onFinished = require('on-finished');
const moment = require('moment');

module.exports = (options) => {
	// Destruct influxDB options
	let { host, port, database = 'express-influx-logs',
			 username, password, protocol, options, pool } = options;
	
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
				}
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
	}
}