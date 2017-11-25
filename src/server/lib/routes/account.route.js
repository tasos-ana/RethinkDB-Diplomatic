var express = require('express');
var router = express.Router();

var accountService = require('../services/account.service');

router.route('/create')
    .post(function (req,res) {
        new accountService().create(req.body, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/authenticate/:uEmail/:uPassword')
    .get(function (req,res) {
        new accountService().authenticate(req.params.uEmail, req.params.uPassword, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/logout/:uEmail')
    .get(function (req,res) {
        new accountService().logout(req.params.uEmail, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });


router.route('/info/:uEmail')
    .get(function (req,res) {
       new accountService().accountInfo(req.params.uEmail, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
       });
    });

module.exports = router;