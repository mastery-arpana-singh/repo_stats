const express = require('express');
const router = express.Router();
const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');
const {token,base_url} = require('../config/config');
const {getPaginatedResults} = require("../helpers/github-pagination");
const fs = require('fs');
const {getRepoData} = require("../controllers/graphqlCall");
const logger = require('../helpers/logger');
const { exit, off } = require('process');

router.post('/all-repo-details', async (req, res) => {
    try {
        let from = req.body.from;
        let to = req.body.to;
        let offset = req.body.offset ?  req.body.offset : 100;
        from = moment(from).format();
        to = moment(to).format();
        
        const contributorsUrl = `${base_url}/graphql`;
        //const since = "2022-09-09T00:00:00Z"
        const since = from;
        const until = to;
        //const since = moment().subtract(5,'days');
        logger.info(`${moment()}: Since value is ${since}`);
        logger.info(`${moment()}: Until value is ${until}`);
        logger.info(`${moment()}: Offset value is ${offset}`);
        if (to < from) {
            logger.info(`${moment()}: Invalid Date Range !!!`);
            return res.send("Invalid Date Range!!!");
        }
        let diff = moment(req.body.to).diff(moment(req.body.from),'days');
        /*if (diff > 15) {
            logger.info(`${moment()}: Date Range cannot be more than 15days !!!`);
            return res.send("Date Range cannot be more than 15days !!!");
        }*/
        let output = await getRepoData(contributorsUrl, since, until, token, null, offset);
        let fileContent = JSON.stringify(output);
        /*converter.json2csv(output, (err, csv) => {
            if (err) {
                throw err;
            }
            fs.writeFile("data/out.csv", csv, 'utf8', function (err) {
                if (err) {
                    console.log("An error occured while writing JSON Object to File.");
                    return console.log(err);
                }        
                console.log("JSON file has been saved.");
            });
        });*/
        
        fs.writeFile("data/output.json", fileContent, 'utf8', function (err) {
            if (err) {
                logger.info(`${moment()}: An error occured while writing JSON Object to File.`);
                return console.log(err);
            }   
            res.download("data/output.json", (err) => {
                if (err) {
                    logger.info(`${moment()}: Some error occured downloading file ${err}`);
                }
            });
            logger.info(`${moment()}: JSON file has been saved.`);
        });
        //return res.status(200).json(output)
    }catch (e) {
        logger.info(`${moment()}: Error occured : ${e}`);
        return res.status(500).json(
            'Oops something went wrong!'
        )
    }

});
module.exports = router;

