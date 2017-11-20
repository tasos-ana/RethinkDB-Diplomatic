//TODO rename se dashboard requester h kati like this
(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('dashboardService', dashboardService)
        .filter('reverse',reverse)
        .factory('socketService', socketService);

    dashboardService.$inject = ['$http'];
    function dashboardService($http) {
        var service = {};

        service.userByEmail = userByEmail;
        service.pushData = pushData;
        service.getData = getData;
        service.createGroup = createGroup;

        return service;

        // private functions
        function userByEmail(email) {
            return $http.post('/account/user', {email:email})
                .then(handleSuccess, handleError('User do not exist'));
        }

        function pushData(data) {
            return $http.post('/sync/push', data)
                .then(handleSuccess,handleError('Cant push data'));
        }

        function getData(table) {
            return $http.get('sync/get/' + table)
                .then(handleSuccess,handleError('Cant retrieve data from table:' + table));
        }

        function createGroup(data) {
            return $http.post('/account/user/newGroup',data)
                .then(handleSuccess,handleError('Cant create group \'' + data.group + '\' for user ' + data.user));
        }


        function handleSuccess(res) {
            return res.data;
        }

        function handleError(error) {
            return function () {
                return { success: false, message: error };
            };
        }
    }

    reverse.$inject =[];
    function reverse() {
        return function(items) {
            if(typeof items === 'undefined') { return; }
            return angular.isArray(items) ?
                items.slice().reverse() : // If it is an array, split and reverse it
                (items + '').split('').reverse().join(''); // else make it a string (if it isn't already), and reverse it
        };
    }

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
