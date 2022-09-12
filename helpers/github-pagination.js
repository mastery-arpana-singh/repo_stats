const axios = require("axios");
const {token,base_url} = require("../config/config");
const logger = require('../helpers/logger');
const moment = require('moment');
const headers = {'Authorization': `Bearer ${token}`};

exports.getPaginatedResults = async (total, endCursor, repo, since, until) =>{
    try {

    const times = (Math.ceil(total/100) -1)
    let output = []
    if(times < 1){
        return output
    }


    for (let i = 0; i < times; i++) {
        logger.info(`${moment()}: Calling for next records in repository ${repo}, count ${i+1}`);
        //console.log("calling for repo ",repo, " call number ", i+1)
        const query = `
  {
    repository(owner: "masterysystems", name: "${repo}") {
      defaultBranchRef {
        name
        target {
          ... on Commit {
            history(since: "${since}", until: "${until}", after:"${endCursor}") {
              totalCount
              pageInfo{
                endCursor
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
  }`

        const githubAPI = `${base_url}/graphql`;

        const data = await axios.post(githubAPI,{query:query},{headers: headers});

        const branch = data.data.data.repository.defaultBranchRef
        const pageInfo = branch.target.history.pageInfo
        const payload = branch.target.history.edges
        endCursor = pageInfo.endCursor
        const hasNextPage = pageInfo.hasNextPage
        output.push(...payload)
        if(!hasNextPage) break
    }

    return output
    }catch (e) {
        console.log(e);
        throw  new Error(e)
    }

}
