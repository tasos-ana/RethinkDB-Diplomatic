var express = require('express');
var router = express.Router();
var path = require('path');


// serve angular front end files from root path
router.use('/', express.static('server-public', { redirect: false }));

// rewrite virtual urls to angular app to enable refreshing of internal pages
router.get('*', function (req, res, next) {
    res.sendFile(path.resolve('server-public/index.html'));
});

module.exports = router;
