const express = require('express');
const router = express.Router();
const axios = require('axios');
const moment = require('moment');
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

        console.log(commits)


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

router.get('/all-contributors', async (req, res) => {
    try {

        const repo = req.query.repo;
        const commitsUrl = `https://api.github.com/repos/masterysystems/${repo}/stats/contributors`;


        const commits = await axios.get(commitsUrl,{
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(commits)


        const users =  {}

        const output = [];

        const payload = []

        commits.data.forEach(c =>{
            const stats  = {
                a: 0,
                d:0,
                c:0
            }
            c.weeks.forEach(w =>{
                const getMonth = moment(w.w * 1000).format('MMM-YY')
                const getWeek = moment(w.w * 1000).format('MM-DD-YY')
                const foundMonth = payload.findIndex(m=> m.month === getMonth)
                if(foundMonth > -1){
                    const monthData = payload[foundMonth]
                    const foundWeek = monthData.weeks.findIndex(w => w.name === getWeek)
                    if(foundWeek >-1){
                        monthData.weeks[foundWeek].users.push({
                            name: c.author.login,
                                a: w.a,
                            d:w.d,
                            c:w.c,
                        })
                    }else{
                        monthData.weeks.push({
                            name: getWeek,
                            users:[{
                                name: c.author.login,
                                a: w.a,
                                d:w.d,
                                c:w.c,
                            }]
                        })
                    }
                }else{
                    payload.push({
                    month: getMonth,
                    weeks:[{
                        name: getWeek,
                        users:[{
                            name: c.author.login,
                            a: w.a,
                            d:w.d,
                            c:w.c,
                        }]
                    }]

                    })
                }
                stats['a'] += w.a;
                stats['d'] += w.d;
                stats['c'] += w.c;
            })

        })

        return res.status(200).json(payload)
    }catch (e) {
        console.log(e)
        return res.status(500).json(
            'Oops something went wrong!'
        )
    }

});
module.exports = router;



// [{
//     month: 'name',
//     weeks:[{
//         name: '',
//         users:[{
//             name: '',
//             a:'',
//             d:'',
//             c:'',
//         }]
//     }]
//         ...
// }]
