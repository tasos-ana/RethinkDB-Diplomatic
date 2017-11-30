(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('socketService', socketService);

    socketService.$inject = [];
    function socketService() {
        let socket = null;

        return {
            connect     : _connect,
            logout      : _logout,
            deleteGroup : _deleteGroup,
            on          : _on,
            emit        : _emit
        };


        function _connect() {
            socket = io();
        }

        function _logout() {
            if(socket !== null){
                socket.emit('logout');
            }
        }

        function _deleteGroup(gID) {
            if(socket === null){
                _connect();
            }
            socket.emit('deleteGroup',gID);
        }

        function _on(gID, callback) {
            if(socket === null){
                _connect();
            }
            socket.on(gID, callback);
        }

        function _emit(gID) {
            if(socket === null){
                _connect();
            }
            socket.emit('sync', gID);
        }
    }
})();
