const prefix = '/api';
const GitHubApi = require('./githubApi');

module.exports = (app) => {
    app.use(`${prefix}/github`,GitHubApi)
}