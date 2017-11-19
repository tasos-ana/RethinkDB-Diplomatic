var path = require('path');

module.exports = {
    db: {
        listenPort: 28015,
        host:       'localhost',
        defaultName: 'pushUP',
        defaultTables: [
            {table : 'accounts', key : 'email'},
            {table : 'groups'  , key : 'id'   },
            {table : 'sockets' , key : 'id'   }
        ]
    },
    server: {
        listenPort: 3000,                                       // The port on which the server is to listen (means that the app is at http://localhost:3000 for instance)
        listenAddress: '192.168.10.5',
        listenAddressVPN: '147.52.151.55',
        securePort: 8433,                                       // The HTTPS port on which the server is to listen (means that the app is at https://localhost:8433 for instance)
        distFolder: path.resolve(__dirname, '../client'),       // The folder that contains the application files (note that the files are in a different repository) - relative to this file
        staticUrl: '/static',                                   // The base url from which we serve static files (such as js, css and images)
        cookieSecret: 'angular-app'                             // The secret for encrypting the cookie
    }
};