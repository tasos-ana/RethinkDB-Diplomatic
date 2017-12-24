(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('settingsService', settingsService);

    settingsService.$inject = ['$rootScope', '$location', 'httpService'];
    function settingsService($rootScope, $location, httpService) {
        const service = {};

        return service;

    }
})();