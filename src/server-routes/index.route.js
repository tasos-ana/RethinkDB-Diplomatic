var express = require('express');
var router = express.Router();

/* GET home page. */

router.get('/home', function (req,res) {
    res.redirect("http://localhost:3000/#!/home");
});

router.get('/login', function (req,res) {
    res.redirect("http://localhost:3000/#!/login");
});

router.get('/register', function (req,res) {
    res.redirect("http://localhost:3000/#!/register");
});

router.get('/about', function (req,res) {
    res.redirect("http://localhost:3000/#!/about");
});

module.exports = router;
