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
        new accountService().getAccount(req.body, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/logout')
    .post(function (req,res) {
        new accountService().logout(req.body.email, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/user')
    .post(function (req,res) {
       new accountService().getAccount2(req.body.email, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
       });
    });

router.route('/user/newGroup')
    .post(function (req,res) {
        new accountService().addGroup(req.body, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

module.exports = router;