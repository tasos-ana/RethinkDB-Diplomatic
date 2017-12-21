(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$rootScope', '$location', 'httpService', 'socketService', '$timeout'];
    function SettingsController($rootScope, $location, httpService, socketService, $timeout) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
        })();

    }
})();