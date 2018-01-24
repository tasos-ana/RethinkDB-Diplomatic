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
        accountService.authenticate({uEmail : req.query.uEmail, uPassword : req.query.uPassword}, function (err,responseData) {
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
            //If rememberMe is true we add 7days on cookie Expired
            if(req.query.rememberMe){
                let cookieExp = new Date();
                cookieExp.setDate(cookieExp.getDate() + 7);
                res.cookie('userCredentials', cookie, { maxAge : cookieExp});
            }else{//else we dont add time, this cookie will expired when browser close
                res.cookie('userCredentials', cookie);
            }
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

router.route('/update/details')
    .post(function (req,res) {
        accountService.updateAccountDetails(req.body ,req.cookies.userCredentials, function (err,responseData) {
            if(err){
                if(responseData.wrongPassword!==undefined && responseData.wrongPassword){
                    return res.json({'success' : true, data : responseData});
                }else{
                    return res.json({'success' : false, 'message': responseData, 'data' : null});
                }
            }
            /**
             * RE-Initialize cookie for user and encrypt it
             */
            const cookie = encryption.encrypt(JSON.stringify(responseData.cookie));
            res.cookie('userCredentials', cookie);
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData.data});
        });
    });
module.exports = router;