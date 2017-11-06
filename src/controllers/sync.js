var express = require('express');
var router = express.Router();
//require model file
var syncModel = require('../models/sync');

router.route('/')
  .get(function(req,res) {
    // Code to fetch data.
    var dataObject = new syncModel();
    // Calling our model function
    dataObject.getAllData(function(err,responseData){
    	if(err) {
    		return res.json({"responseCode" : 1, "responseDesc" : responseData});
    	}
    	res.json({"responseCode" : 0, "responseDesc" : "Success", "data" : responseData});
    });
  })
  .post(function(req,res) {
    // Code to add new data.
    var dataObject = new syncModel();
    // Calling our model function
    dataObject.addNewData(req.body, function(err,responseData){
    	if(err){
    		return res.json({"responseCode" : 1, "responseDesc" : responseData});
    	}
    	res.json({"responseCode" : 0, "responseDesc" : "Success", "data" : responseData});
    });
  });

module.exports = router;