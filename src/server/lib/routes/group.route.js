const express = require('express');
const router = express.Router();
const groupService = require('../services/group.service');

router.route('/create')
    .post(function (req,res) {
        groupService.createGroup(req.body, req.header('Authorization'), function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/retrieve/:gID')
    .get(function (req,res) {
        groupService.retrieveGroup(req.params.gID, req.header('Authorization'), function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/add')
    .post(function (req,res) {
        groupService.addData(req.body, req.header('Authorization'), function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/update/name')
    .post(function (req,res) {
        groupService.updateGroupName(req.body, req.header('Authorization'), function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

router.route('/delete/:gID')
    .get(function (req,res) {
        groupService.deleteGroup(req.params.gID, req.header('Authorization'), function (err, responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

module.exports = router;