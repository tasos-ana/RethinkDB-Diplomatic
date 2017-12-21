(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'httpService','homeService', 'socketService', '$timeout'];
    function DashboardController($rootScope, $location, httpService, homeService, socketService, $timeout) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
        })();

    }
})();