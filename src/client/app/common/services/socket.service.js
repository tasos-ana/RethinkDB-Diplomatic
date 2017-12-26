(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('socketService', socketService);

    socketService.$inject = [];
    function socketService() {
        let socket = null;

        return {
            connectSocket           : _connectSocket,
            disconnectSocket        : _disconnectSocket,

            emitOpenGroup           : _emitOpenGroup,
            emitCloseGroup          : _emitCloseGroup,
            emitDeleteGroup         : _emitDeleteGroup,

            onGroupNameChange       : _onGroupNameChange,
            onGroupDataChange       : _onGroupDataChange,
            onGroupDataBadge        : _onGroupDataBadge,
            onGroupCreate           : _onGroupCreate,
            onGroupDelete           : _onGroupDelete,

            onAccountNameChange     : _onAccountNameChange,
            onAccountPasswordChange : _onAccountPasswordChange
        };

        function _connectSocket() {
            socket = io();
        }

        function _disconnectSocket() {
            if(socket !== null){
                socket.emit('logout');
            }
        }

        function _emitOpenGroup(gID) {
            socketValidate();
            socket.emit('openGroup', gID);
        }

        function _emitCloseGroup(gID) {
            socketValidate();
            socket.emit('closeGroup', gID);
        }

        function _emitDeleteGroup(gID) {
            socketValidate();
            socket.emit('deleteGroup', gID);
        }

        function _onGroupNameChange(callback) {
            socketValidate();
            socket.on('groupNameChange', callback);
        }

        function _onGroupDataChange(callback) {
            socketValidate();
            socket.on('groupDataChange', callback);
        }

        function _onGroupDataBadge(callback) {
            socketValidate();
            socket.on('groupDataBadge', callback);
        }

        function _onGroupCreate(callback) {
            socketValidate();
            socket.on('groupCreate', callback);
        }

        function _onGroupDelete(callback) {
            socketValidate();
            socket.on('groupDelete', callback);
        }

        function _onAccountNameChange(callback) {
            socketValidate();
            socket.on('accountNameChange', callback);
        }

        function _onAccountPasswordChange(callback) {
            socketValidate();
            socket.on('accountPasswordChange', callback);
        }
        
        function socketValidate() {
            if(socket === null){
                _connectSocket();
            }
        }
    }
})();
