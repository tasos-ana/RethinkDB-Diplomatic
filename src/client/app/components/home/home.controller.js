(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$rootScope', '$location', 'homeService', 'dashboardService', 'ngNotify'];
    function HomeController($rootScope, $location, homeService, dashboardService, ngNotify) {
        const vm = this;

        (function initController() {
            vm.dataLoading = true;
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(function () {

            });

            ngNotify.config({
                sticky   : false,
                duration : 5000
            });
            ngNotify.addType('notice-success','bg-success text-dark');
            ngNotify.addType('notice-danger','bg-danger text-light');
            ngNotify.addType('notice-info','bg-info text-dark');

            vm.dataLoading = false;

        })();
    }
})();