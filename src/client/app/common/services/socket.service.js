(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('socketService', socketService);

    socketService.$inject = [];
    function socketService() {
        const socket = io();

        return {
            on: function (eventName, callback) {
                socket.on(eventName,callback);
            },
            emit: function (table) {
                socket.emit('feed', table);
            }
        };
    }
})();
