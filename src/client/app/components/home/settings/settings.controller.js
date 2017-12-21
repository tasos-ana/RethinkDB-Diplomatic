(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$rootScope', '$location', 'httpService','homeService', 'socketService', '$timeout'];
    function SettingsController($rootScope, $location, httpService, homeService, socketService, $timeout) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
        })();

    }
})();