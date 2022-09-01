const app = require('../app');
const http = require('http');
const { normalize } = require('path');

//const port = normalizePort('3000');
const port = 3000;
app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    return false;
}

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string' ? 'Pipe' + port : 'Port' + port;

    switch (error.code) {
        case 'EACCES':
            console.log(bind + ':elavated privileges required')
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.log(bind + ':port is already in use.')
            process.exit(1)
            break
        default:
            console.log(bind + ':some unknown error occured')
            throw error
    }
}

function onListening() {
    let addr = server.address();
    let bind = typeof addr === 'string' ? 'pipe' + addr : 'port' + addr.port;
    console.log('Listening on' + bind);
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
    // application specific logging, throwing an error, or other logic here
})