(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('socketService', socketService);

    socketService.$inject = [];
    function socketService() {
        const socket = io();

        return {
            logout: function () {
              socket.emit('logout');
            },
            on: function (gID, callback) {
                socket.on(gID, callback);
            },
            emit: function (gID) {
                socket.emit('sync', gID);
            }
        };
    }
})();
