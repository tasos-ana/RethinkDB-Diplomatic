(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$rootScope', '$location', 'homeService', 'dashboardService'];
    function SettingsController($rootScope, $location, homeService, dashboardService) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(dashboardService.retrieveGroupsName);
        })();

    }
})();