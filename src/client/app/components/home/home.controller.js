(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$rootScope', '$location', 'homeService'];
    function HomeController($rootScope, $location, homeService) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(function () {});
        })();
    }
})();