(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$rootScope', '$location', 'homeService', 'socketService'];
    function HomeController($rootScope, $location, homeService, socketService) {
        const vm = this;

        (function initController() {
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(function () {});


            socketService.onAccountNameChange(function () {
                //todo
            });

            socketService.onAccountPasswordChange(function () {
                //todo
            });

            socketService.onGroupCreate(function () {
                //todo
            });

            socketService.onGroupDelete(function () {
                //todo
            });

            socketService.onGroupNameChange(function () {
                //todo
            });

            socketService.onGroupDataBadge(function () {
                //todo
            });
        })();
    }
})();