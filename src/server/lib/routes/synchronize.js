var express = require('express');
var router = express.Router();

var syncService = require('../services/synchronize.service');

router.route('/push')
    .post(function (req,res) {
        new syncService().add(req.body , function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

module.exports = router;