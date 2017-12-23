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

router.route('/retrieve/data')
    .get(function (req,res) {
        groupService.retrieveGroupData(req.query.gID, req.cookies.userCredentials, function (err, responseData) {
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

router.route('/add')
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
        groupService.deleteGroup(req.query.gID, req.cookies.userCredentials, function (err, responseData) {
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

module.exports = router;