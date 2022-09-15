const axios = require("axios");
const {token} = require("../config/config");
const moment = require('moment');
const {getPaginatedResults} = require("../helpers/github-pagination");
const logger = require("../helpers/logger");
const headers = {'Authorization': `Bearer ${token}`};

let result = null,count = 0, hasNextPage = null;

exports.getRepoData = async (contributorsUrl, since, until, token, endCursor, offset) =>{ 
    try {
        let query = endCursor ? await this.queryWithEndCursor(since,until,endCursor,offset) : await this.queryWithoutEndCursor(since,until,offset) ;
        //console.log("query ",query);
        count ++;
        logger.info(`${moment()}: Calling Repo graphql query , count ${count} ,  endCursor : ${endCursor}, hasNextPage : ${hasNextPage}`);
        const data = await axios.post(contributorsUrl, {query: query}, {headers: headers});
        const repoCount = data.data.data.search.repositoryCount
        const repos = data.data.data.search.edges;
        
        const output = await this.formatData(repos, since, until, result);

        if (data.data.data.search.pageInfo.hasNextPage) {
            result = output;
            endCursor = data.data.data.search.pageInfo.endCursor;
            //endCursor = null;
        } else {
            endCursor = null;
            count = 0;
        }

        if (endCursor) {
            hasNextPage = data.data.data.search.pageInfo.hasNextPage;
            await this.getRepoData(contributorsUrl, since, until, token, endCursor, offset);
        }

        return output;
    } catch(e) {
        //console.log("e is ",e)
        count = 0;
        logger.info(`${moment()}: Some Error occured inside graphqlCall:getRepoData() ${e}`)
        throw  new Error(e)
    }
    
}

exports.queryWithoutEndCursor = async (since,until, offset) => {
    return `query myOrgRepos {search(query: "org:masterysystems", type: REPOSITORY, first: ${offset}) {
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
                    history(since: "${since}", until: "${until}") {
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
        }`;
}

exports.queryWithEndCursor = async (since, until, endCursor, offset) => {
    return `query myOrgRepos {
        search(query: "org:masterysystems", type: REPOSITORY, first: ${offset}, after: "${endCursor}") {
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
                    history(since: "${since}", until: "${until}") {
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
        }`;
}

exports.formatData = async (repos, since, until, output) => {
    try {
        output = output ? output : [];
        for (const repo of repos) {
            const repoData = {
                repoName: repo.node.name,
                repoCreatedAt: repo.node.createdAt,
                totalCommits: 0,
                totalContribuors: 0,
                commits: []
            }

            const branchData = repo.node.defaultBranchRef

            const totalCommits = branchData ? branchData.target.history.totalCount : 0;
        
            repoData.totalCommits = totalCommits;
            const endCursor = branchData ? branchData.target.history.pageInfo.endCursor : null;
            const hasNextPage = branchData ? branchData.target.history.pageInfo.hasNextPage : false;
            let extraCommits = []
            if(hasNextPage){
                extraCommits = await getPaginatedResults(totalCommits,endCursor, repoData.repoName, since, until)
            }
            let bthe = branchData ? branchData.target.history.edges : [];
            const commits = [...bthe, ...extraCommits]

            let commitsObject = await this.formatCommits(commits);
            
            repoData.commits.push(...Object.values(commitsObject))
            repoData.totalContribuors = repoData.commits.length;
            output.push(repoData)
        }
        return output;
    } catch(e) {
        logger.info(`${moment()}: Some Error occured inside graphqlCall:formatData() ${e}`)
        throw  new Error(e)
    }
    
}

exports.formatCommits = async (commits) => {
    try {
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
        }
        return commitsObject;
    } catch(e) {
        logger.info(`${moment()}: Some Error occured inside graphqlCall:formatCommits() ${e}`)
        throw  new Error(e)
    }
    
}