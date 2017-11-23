var express = require('express');
var compression = require('compression');
var favicon = require('serve-favicon');

exports.addRoutes = function(app, config) {
    // Serve up the favicon
    app.use(favicon(config.server.distFolder + '/favicon.ico'));

    // First looks for a static file: index.html, css, images, etc.
    app.use(config.server.staticUrl, compression());
    app.use(express.static(config.server.distFolder));
    app.use(config.server.staticUrl, function(req, res, next) {
        res.send(404); // If we get here then the request for a static file is invalid
    });
};