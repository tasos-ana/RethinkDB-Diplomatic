(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$rootScope', '$location', 'httpService', 'socketService', '$timeout'];
    function HomeController($rootScope, $location, httpService, socketService, $timeout) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
        })();

    }
})();