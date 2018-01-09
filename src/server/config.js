const path = require('path');

process.env.ENCRYPTION_KEY = 'HXUE+mGsk,A(wsZu4+v4alKp/d&21R^m';

module.exports = {
    db: {
        listenPort      : 28015,
        host            : 'localhost',
        defaultName     : 'pushUP',
        defaultTables   : [
                            {name : 'accounts', key : 'email'},
                            {name : 'groups'  , key : 'id'   }
        ],
        lastTable       : 'groups'
    },
    server: {
        listenPort      : 80,                                   // The port on which the server is to listen (means that the app is at http://localhost:3000 for instance)
        listenAddress   : '147.52.9.53',
        listenAddressVPN: '147.52.151.51',
        securePort      : 8433,                                 // The HTTPS port on which the server is to listen (means that the app is at https://localhost:8433 for instance)
        distFolder      : path.resolve(__dirname, '../client'), // The folder that contains the application files (note that the files are in a different repository) - relative to this file
        staticUrl       : '/static',                            // The base url from which we serve static files (such as js, css and images)
        cookieSecret    : process.env.ENCRYPTION_KEY            // The secret for encrypting the cookie
    }
};
