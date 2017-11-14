var express = require('express');
var router = express.Router();

var accountService = require('../services/account.service');

router.route('/create')
    .post(function (req,res) {
        new accountService().create(req.body , function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/login')
    .post(function (req,res) {
        new accountService().authenticate(req.body, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/user/:email')
    .get(function (req,res) {
       new accountService().authenticate({"email": req.params.email, "password": null}, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
       });
    });

module.exports = router;