const express = require('express');
const router = express.Router();

const accountService    = require('../services/account.service');
const encryption        = require('../services/security/encryption.security');

router.route('/create')
    .post(function (req,res) {
        accountService.create(req.body, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });


router.route('/authenticate')
    .get(function (req,res) {
        accountService.authenticate(req.query.uEmail, req.query.uPassword, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            /**
             * Initialize cookie for user and encrypt it
             */
            const cookie = encryption.encrypt(JSON.stringify({
                uEmail      : req.query.uEmail,
                uPassword   : req.query.uPassword
            }));
            res.cookie('userCredentials', cookie);
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });


router.route('/info')
    .get(function (req,res) {
        accountService.info(req.query.uEmail ,req.cookies.userCredentials, function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
       });
    });

module.exports = router;