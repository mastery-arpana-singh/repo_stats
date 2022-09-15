const winston = require('winston');

/*const logger = winston.createLogger({
    level: 'info',
    format: winston.format.printf(info => `${info.message}`),
    transports: [
      new winston.transports.File({
        filename: 'logs/server.log',
        level: 'info',
        maxsize: 500
      })
    ]
  });*/
  const logger = winston.createLogger({
    transports: [
      new winston.transports.File({
        level: 'info',
        filename: 'logs/server.log',
        handleExceptions: true,
        maxsize: 5242880, // 5MB
      }),
      new winston.transports.Console({
        level: 'debug',
        handleExceptions: true,
      })
    ],
    exitOnError: false, // do not exit on handled exceptions
  });
  

  module.exports = logger;