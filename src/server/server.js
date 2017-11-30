const express         = require('express');
const path            = require('path');
const logger          = require('morgan');
const cookieParser    = require('cookie-parser');
const cookieSession   = require('cookie-session');
const bodyParser      = require('body-parser');

const config          = require('./config');
const xsrf            = require('./lib/services/security/xsrf.security');
const protectJSON     = require('./lib/services/security/protectJSON.security');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// static page like index.html
require('./lib/routes/static.route').addRoutes(app, config);

// protections
app.use(protectJSON);
app.use(cookieParser(config.server.cookieSecret));
app.use(cookieSession({
    keys: [config.server.cookieSecret]
}));
app.use(xsrf);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/account', require('./lib/routes/account.route'));
app.use('/group', require('./lib/routes/group.route'));


require('./lib/routes/appFile.route').addRoutes(app, config);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

