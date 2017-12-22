(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$rootScope', '$location', 'homeService'];
    function SettingsController($rootScope, $location, homeService) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(function () {});
        })();

    }
})();