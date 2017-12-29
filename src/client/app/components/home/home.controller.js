(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$rootScope', '$location', 'homeService', 'socketService', 'dashboardService', 'ngNotify'];
    function HomeController($rootScope, $location, homeService, socketService, dashboardService, ngNotify) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(dashboardService.retrieveGroupsName);

            ngNotify.config({
                sticky   : false,
                duration : 5000
            });
            ngNotify.addType('notice-success','bg-success text-dark');
            ngNotify.addType('notice-danger','bg-danger text-light');
            ngNotify.addType('notice-info','bg-info text-dark');

            socketService.connectSocket();

            socketService.onAccountNameChange();
            socketService.onAccountPasswordChange();

            socketService.onGroupCreate();
            socketService.onGroupDelete();
            socketService.onGroupNameChange();

            socketService.onGroupDataBadge();

        })();
    }
})();