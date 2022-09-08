const axios = require("axios");
const {token} = require("../config/config");


exports.getPaginatedResults = async (total, endCursor, repo, since) =>{
    try {

    const times = (Math.ceil(total/100) -1)
    let output = []
    if(times < 1){
        return output
    }


    for (let i = 0; i < times; i++) {
        console.log(i)
        const query = `
  {
    repository(owner: "masterysystems", name: "${repo}") {
      defaultBranchRef {
        name
        target {
          ... on Commit {
            history(since: "${since}", after:"${endCursor}") {
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

        const githubAPI = `https://api.github.com/graphql`;

        const data = await axios.post(githubAPI,{query:
            query
        },{
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

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
