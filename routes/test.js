const express = require('express');
const router = express.Router();
const request = require('request');

router.get('/testapi', (req, res) => {
    var url = 'https://api.github.com/repos/masterysystems/mastery-frontend/stats/contributors';

    request.get({
    uri: url, 
    headers: {
        'user-agent': 'node.js',
        'X-Auth-Token': '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'
    }
    }, function(err, httpResponse, body) {
    if (err) {
        console.log("i am here 17");
        return console.error('get failed:', err);
    }
    console.log("i am here 20",httpResponse);
    console.log('Get successful!  Server responded with:', body);
    res.send(body);
    });
    
});

module.exports = router;