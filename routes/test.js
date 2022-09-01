const express = require('express');
const router = express.Router();
const axios = require('axios');
const _ = require('lodash');
const {token} = require('../config/config');

router.get('/top-contributors', async (req, res) => {
    try {

        const repo = req.query.repo;
    const contributorsUrl = `https://api.github.com/repos/masterysystems/${repo}/contributors?q=contributions&order=desc`;
    const commitsUrl = `https://api.github.com/repos/masterysystems/${repo}/stats/contributors`;

   const contributorsList = await axios.get(contributorsUrl,{
    headers: {
        'Authorization': `Bearer ${token}`
    }
    });

        const commits = await axios.get(commitsUrl,{
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });


        const users =  {}
         contributorsList.data.map(c => users[c.id] = c)

        const output = []
        commits.data.forEach(c =>{
            const stats  = {
                a: 0,
                d:0,
                c:0
            }
            c.weeks.map(w =>{
                stats['a'] += w.a;
                stats['d'] += w.d;
                stats['c'] += w.c;
            })
            if(users[c.author.id]){
                users[c.author.id].stats = stats
            // output.push(users[c.author.id])
            output.push({
                name: c.author.login,
                id: c.author.id,
                picture:c.author.avatar_url,
                commits: stats.c,
                contributions: users[c.author.id].contributions,
                additions: stats.a,
                deletions: stats.d,
            })
            }

        })

        const sorted = _.orderBy(output,'contributions','desc')

        return res.status(200).json(sorted)
    }catch (e) {
        console.log(e)
        return res.status(500).json(
            'Oops something went wrong!'
        )
    }

});

module.exports = router;
