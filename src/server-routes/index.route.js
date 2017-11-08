var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/login', redirectHome);
router.get('/register',redirectHome);
router.get('/about',redirectHome);

function redirectHome(req,res) {
    res.redirect('/');
}

module.exports = router;
