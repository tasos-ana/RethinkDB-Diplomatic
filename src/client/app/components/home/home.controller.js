(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$rootScope', '$location', 'homeService', 'socketService', 'dashboardService'];
    function HomeController($rootScope, $location, homeService, socketService, dashboardService) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(dashboardService.retrieveGroupsName);

            socketService.onAccountNameChange();
            socketService.onAccountPasswordChange();

            socketService.onGroupCreate();
            socketService.onGroupDelete();
            socketService.onGroupNameChange();
            socketService.onGroupDataBadge();

        })();
    }
})();