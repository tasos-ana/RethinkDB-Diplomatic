(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('socketService', socketService);

    socketService.$inject = [];
    function socketService() {
        var socket = io();

        return {
            logout: function () {
              socket.emit('logout');
            },
            on: function (gID, callback) {
                console.log('socket listen on ' + gID);
                socket.on(gID, callback);
            },
            emit: function (gID) {
                console.log('send emit '+ gID);
                socket.emit('sync', gID);
            }
        };
    }
})();
