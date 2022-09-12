require('dotenv').config()

const app = require('../app');
const http = require('http');
const logger = require('../helpers/logger');
const moment = require('moment');
const port = 3000;
app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            logger.info(`${moment()}: EACCESS  ${bind} elavated privileges required`)
            process.exit(1)
            break
        case 'EADDRINUSE':
            logger.info(`${moment()}: EADDRINUSE  ${bind} port is already in use.`)
            process.exit(1)
            break
        default:
            logger.info(`${moment()}: ${bind} Some unknown error occured.`)
            //console.log(bind + ':some unknown error occured')
            throw error
    }
}

function onListening() {
    let addr = server.address();
    let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    logger.info(`${moment()}: Listening on ${bind}`)
    //console.log('Listening on' + bind);
}

process.on('unhandledRejection', (reason, p) => {
    logger.info(`${moment()}: Unhandled Rejection at Promise ${p}, reason ${reason}`)
    //console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
    // application specific logging, throwing an error, or other logic here
})
