var express = require('express');
var router = express.Router();

var accountService = require('../server-service/account.service');

router.route('/create')
    .post(function (req,res) {
        new accountService().create(req.body , function (err,responseData) {
            if(err){
                return res.json({'success' : false, 'message': responseData, 'data' : null});
            }
            res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
        });
    });

//TODO na kanoume match ta data pou tha epistrafoun me afta pou exei dwsei o xristis gia endexomeno change
router.route('/authenticate')
    .post(function (req,res) {
       new accountService().authenticate(req.body, function (err,responseData) {
          if(err){
              return res.json({'success' : false, 'message': responseData, 'data' : null});
          }
           res.json({'success' : true, 'message' : 'Success', 'data' : responseData});
       });
    });

module.exports = router;