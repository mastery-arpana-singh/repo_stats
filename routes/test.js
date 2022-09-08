const express = require('express');
const router = express.Router();
const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');
const {token} = require('../config/config');
const {getPaginatedResults} = require("../helpers/github-pagination");

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

router.get('/repo-list', async (req, res) => {
    try {

        const contributorsUrl = `https://api.github.com/graphql`;

        let filters = `first: ${req.query.per_page}`
        if(req.query.page){
            filters+=` after:"${req.query.page}"`
        }
        const data = await axios.post(contributorsUrl,{query:
            `query myOrgRepos {
  search(query: "org:masterysystems", type: REPOSITORY, ${filters}) {
    repositoryCount,
      pageInfo {
        endCursor
        startCursor
        hasNextPage
    },
    edges {
      node {
        ... on Repository {
          name,
          id,
          createdAt
        }
      }
    }
  }
}
`
        },{
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        return res.status(200).json(data.data)
    }catch (e) {
        console.log(e)
        return res.status(500).json(
            'Oops something went wrong!'
        )
    }

});
router.get('/repo-list-commits', async (req, res) => {
    try {

        const contributorsUrl = `https://api.github.com/graphql`;
        const since = "2022-09-08T00:00:00Z"
        const data = await axios.post(contributorsUrl,{query:
            `query myOrgRepos {
  search(query: "org:masterysystems", type: REPOSITORY, first: 100) {
    repositoryCount
    pageInfo {
      endCursor
      startCursor
      hasNextPage
    }
    edges {
      node {
        ... on Repository {
          name
          id
          createdAt
          defaultBranchRef {
            target {
              ... on Commit {
                history(since: "${since}") {
                  totalCount
                  pageInfo {
                    endCursor
                    startCursor
                    hasNextPage
                  }
                  edges {
                    node {
                        committedDate
                        additions
                        deletions
                        author {
                          name
                          email
                           user {
                            id
                            login
                          }
                        }
                      
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`
        },{
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        const repoCount = data.data.data.search.repositoryCount
        const repos = data.data.data.search.edges;

        const output = []
        for (const repo of repos) {
            const repoData = {
                repoName: repo.node.name,
                repoCreatedAt: repo.node.createdAt,
                commits: []
            }

            const branchData = repo.node.defaultBranchRef

            const totalCommits = branchData.target.history.totalCount
            const endCursor = branchData.target.history.pageInfo.endCursor
            const hasNextPage = branchData.target.history.pageInfo.hasNextPage
            let extraCommits = []
                if(hasNextPage){
                    extraCommits = await getPaginatedResults(totalCommits,endCursor, repoData.repoName, since)
                }
            const commits = [...branchData.target.history.edges, ...extraCommits]


            let commitsObject = {}
            for (const commit of commits) {
                const com = {
                    author: commit.node.author.user ? commit.node.author.user.login : commit.node.author.email,
                    commits :[]
                }

                const existingUser = commitsObject[com.author]
                if(existingUser){
                    const  i = existingUser.commits.findIndex(c => c.committedDate === moment(commit.node.committedDate).format('YYYY-MM-DD'))
                    if(i > -1){
                        existingUser.commits[i].additions += commit.node.additions
                        existingUser.commits[i].deletions += commit.node.deletions
                        existingUser.commits[i].commitCount += 1
                    }else{
                        existingUser.commits.push({
                            committedDate: moment(commit.node.committedDate).format('YYYY-MM-DD'),
                            additions: commit.node.additions,
                            deletions: commit.node.deletions,
                            commitCount:1
                        })
                    }
                }else{
                    com.commits.push({
                        committedDate: moment(commit.node.committedDate).format('YYYY-MM-DD'),
                        additions: commit.node.additions,
                        deletions: commit.node.deletions,
                        commitCount:1
                    })
                    commitsObject[com.author] = com;
                }

                // commitsObject = {}
            }
            // commitsData.push()
            repoData.commits.push(...Object.values(commitsObject))
            output.push(repoData)

        }



        return res.status(200).json(output)
    }catch (e) {
        console.log(e)
        return res.status(500).json(
            'Oops something went wrong!'
        )
    }

});


module.exports = router;

