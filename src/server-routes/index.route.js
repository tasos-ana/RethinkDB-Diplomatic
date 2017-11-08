var express = require('express');
var router = express.Router();


router.route('/register')
    .get(function(req,res) {
        res.redirect('/');
    });

router.route('/login')
    .get(function(req,res) {
        res.redirect('/');
    });

router.route('/about')
    .get(function(req,res) {
        res.redirect('/');
    });

router.use('/sync',require('./synchronize.route'));

module.exports = router;