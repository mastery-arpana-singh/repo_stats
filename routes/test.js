const express = require('express');
const router = express.Router();
const axios = require('axios');
const _ = require('lodash');
const { token } = require('../config/config');

router.get('/top-contributors', async (req, res) => {
    try {

        const repo = req.query.repo;
        const contributorsUrl = `https://api.github.com/repos/masterysystems/${repo}/contributors?q=contributions&order=desc`;
        const commitsUrl = `https://api.github.com/repos/masterysystems/${repo}/stats/contributors`;

        const contributorsList = await axios.get(contributorsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const commits = await axios.get(commitsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });


        const users = {}
        contributorsList.data.map(c => users[c.id] = c)

        const output = []
        commits.data.forEach(c => {
            const stats = {
                a: 0,
                d: 0,
                c: 0
            }
            c.weeks.map(w => {
                stats['a'] += w.a;
                stats['d'] += w.d;
                stats['c'] += w.c;
            })
            if (users[c.author.id]) {
                users[c.author.id].stats = stats
                // output.push(users[c.author.id])
                output.push({
                    name: c.author.login,
                    id: c.author.id,
                    picture: c.author.avatar_url,
                    commits: stats.c,
                    contributions: users[c.author.id].contributions,
                    additions: stats.a,
                    deletions: stats.d,
                })
            }

        })

        const sorted = _.orderBy(output, 'contributions', 'desc')

        return res.status(200).json(sorted)
    } catch (e) {
        console.log(e)
        return res.status(500).json(
            'Oops something went wrong!'
        )
    }

});
router.get('/adddelcode', async (req, res) => {
    try {

        const repo = req.query.repo;
        const commitsUrl = `https://api.github.com/repos/masterysystems/${repo}/stats/contributors`;


        const commits = await axios.get(commitsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        let monthArr=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        let currDate = new Date().toISOString().slice(0, 10);
        let currMonth = Number(currDate.slice(5, 7));
        let currYear = Number(currDate.slice(0, 4));
        let count = 0;
        let prevYeararr = [];
        let currYeararr = [];
        for (let i = 0; i <= 12 - currMonth; i++) {
            let obj = { a: 0, d: 0, month: 0, year: 0};
            prevYeararr.push(obj);
        }
        for (let i = 0; i < currMonth; i++) {
            let obj = { a: 0, d: 0, month: 0, year: 0};
            currYeararr.push(obj);
        }
        for (let i = 0; i < commits.data.length; i++) {
            for (let j = 0; j < commits.data[i].weeks.length; j++) {
                let weekIndex = commits.data[i].weeks[j].w;
                var date = new Date(weekIndex * 1000);
                let year = date.getFullYear();
                let prevMonth = date.getMonth() + 1;

                if (year == currYear - 1 && prevMonth >= currMonth && prevMonth <= 12) {
                    let index = prevMonth - currMonth;
                    prevYeararr[index].a = prevYeararr[index].a + commits.data[i].weeks[j].a;
                    prevYeararr[index].d = prevYeararr[index].d + commits.data[i].weeks[j].d;
                    prevYeararr[index].month = monthArr[prevMonth-1];
                    prevYeararr[index].year = year;
                } else if (year == currYear && prevMonth <= currMonth) {
                    let index = prevMonth - 1;
                    currYeararr[index].a = currYeararr[index].a + commits.data[i].weeks[j].a;
                    currYeararr[index].d = currYeararr[index].d + commits.data[i].weeks[j].d;
                    currYeararr[index].month = monthArr[prevMonth-1];
                    currYeararr[index].year = currYear;
                }
            }
        }

        let finalArr = prevYeararr.concat(currYeararr);
        return res.status(200).json(finalArr)
    } catch (e) {
        console.log(e)
        return res.status(500).json(
            'Oops something went wrong!'
        )
    }

});

module.exports = router;
