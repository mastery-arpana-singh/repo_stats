const prefix = '/api';
const Test = require('./test');

module.exports = (app) => {
    app.use(`${prefix}/test`,Test)
}