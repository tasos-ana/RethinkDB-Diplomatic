const express = require('express');
const router = express.Router();
const accountService = require('../services/account.service');

router.route('/create')
    .post(function (req,res) {
        accountService.create(req.body, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/authenticate/:uEmail/:uPassword')
    .get(function (req,res) {
        accountService.authenticate(req.params.uEmail, req.params.uPassword, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/info/:uEmail')
    .get(function (req,res) {
        accountService.accountInfo(req.params.uEmail, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
       });
    });

module.exports = router;