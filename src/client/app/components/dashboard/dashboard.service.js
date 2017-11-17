(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('dashboardService', dashboardService);

    dashboardService.$inject = ['$http'];
    function dashboardService($http) {
        var service = {};

        service.userByEmail = userByEmail;
        service.pushData = pushData;
        service.getData = getData;

        return service;

        // private functions
        function userByEmail(email) {
            return $http.get('/account/user/' + email).then(handleSuccess, handleError('User do not exist'));
        }

        function pushData(data) {
            return $http.post('/sync/push', data).then(handleSuccess,handleError('Cant push data'));
        }

        function getData(table) {
            return $http.get('sync/get/' + table).then(handleSuccess,handleError('Cant retrieve data from table:' + table));
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

})();
