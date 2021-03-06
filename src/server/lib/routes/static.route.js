const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');

exports.addRoutes = function(app, config) {
    // Serve up the favicon
    app.use(favicon(config.server.distFolder + '/favicon.ico'));

    // First looks for a static file: index.html, css, images, etc.
    app.use(config.server.staticUrl, compression());
    app.use(express.static(config.server.distFolder));
};