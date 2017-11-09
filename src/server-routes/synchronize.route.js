var express = require('express');
var router = express.Router();
//require model file
var syncService = require('../server-service/synchronize.service');

router.route('/')
    .get(function(req,res) {
        // Code to fetch data.
        var dataObject = new syncService();
        // Calling our model function
        dataObject.getAllData(function(err,responseData){
            if(err) {
                return res.json({"success" : false, "message" : responseData});
            }
            res.json({"success" : true, "message" : "Success", "data" : responseData});
        });
    })
    .post(function(req,res) {
        // Code to add new data.
        var dataObject = new syncService();
        // Calling our model function
        dataObject.addNewData(req.body, function(err,responseData){
            if(err){
                return res.json({"success" : false, "message" : responseData});
            }
            res.json({"success" : true, "message" : "Success", "data" : responseData});
        });
    });

module.exports = router;