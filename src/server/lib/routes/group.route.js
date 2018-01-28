const express = require('express');
const router = express.Router();
const groupService = require('../services/group.service');

router.route('/create')
    .post(function (req,res) {
        groupService.createGroup(req.body.gName , req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/share')
    .post(function (req,res) {
        groupService.shareGroup(req.body , req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/retrieve/data')
    .get(function (req,res) {
        groupService.retrieveGroupData({gID : req.query.gID, afterFrom : req.query.afterFrom, limitVal : req.query.limitVal}, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/retrieve/participants')
    .get(function (req,res) {
        groupService.retrieveGroupParticipants(req.query.gID, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/retrieve/file')
    .get(function (req,res) {
        groupService.retrieveFile({gID : req.query.gID, mID : req.query.mID}, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/retrieve/name')
    .get(function (req,res) {
        groupService.retrieveGroupName(req.query.gID, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/add/data')
    .post(function (req,res) {
        groupService.addData(req.body, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/update/name')
    .post(function (req,res) {
        groupService.updateGroupName(req.body, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/delete')
    .get(function (req,res) {
        groupService.deleteGroup({gID : req.query.gID, gName : req.query.gName}, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/participate/leave')
    .get(function (req,res) {
        groupService.leaveParticipateGroup({gID : req.query.gID, gName : req.query.gName}, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/participant/remove')
    .get(function (req,res) {
        groupService.removeParticipateUser({gID : req.query.gID, uEmail : req.query.uEmail}, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/openedList/insert')
    .post(function (req,res) {
        groupService.insertOpenedGroup(req.body, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/openedList/remove')
    .post(function (req,res) {
        groupService.removeOpenedGroup(req.body, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });


router.route('/update/unreadMessages')
    .post(function (req,res) {
        groupService.messageNotification(req.body, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/delete/message')
    .post(function (req,res) {
        groupService.deleteMessage(req.body, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/modify/message')
    .post(function (req,res) {
        groupService.modifyMessage(req.body, req.cookies.userCredentials, function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });
module.exports = router;