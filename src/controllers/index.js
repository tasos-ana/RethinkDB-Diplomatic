var express = require('express');
var router = express.Router();


router.use('/',require('./home'));
router.use('/sync',require('./sync'));

module.exports = router;