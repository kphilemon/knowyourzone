const {createLogger, format, transports} = require('winston');

const options = {
    allLogs: {
        level: 'info',
        filename: 'logs/combined.log',
        format: format.combine(
            format.timestamp(),
            format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
        )
    },
    errorLogs: {
        level: 'error',
        filename: 'logs/error.log',
        format: format.combine(
            format.timestamp(),
            format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
        )
    },
    console: {
        level: 'info',
        format: format.combine(format.colorize(), format.simple())
    }
}

const logger = createLogger({
    transports: [
        new transports.File(options.allLogs),
        new transports.File(options.errorLogs),
    ],
    exitOnError: false
});

if (process.env.NODE_ENV !== 'prod') {
    logger.add(new transports.Console(options.console));
}


module.exports = logger;