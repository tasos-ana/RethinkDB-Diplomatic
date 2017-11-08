var express = require('express');
var router = express.Router();

var accountService = require('../server-service/account.service');

router.route('/')
    .post(function (req,res) {
        new accountService().create(req.body , function (err,responseData) {
            if(err){
                return res.json({'responseCode' : 1, 'responseDesc': responseData});
            }
            res.json({'responseCode' : 0, 'responseDesc' : 'Success', 'data' : responseData});
        });
    });

module.exports = router;