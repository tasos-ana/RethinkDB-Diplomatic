(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$rootScope', '$location', 'httpService', 'ngNotify', '$cookies', 'socketService'];
    function LoginController($rootScope, $location, httpService, ngNotify, $cookies, socketService) {
        const vm = this;

        vm.login = login;

        (function initController() {
            vm.dataLoading = false;

            ngNotify.config({
                sticky   : false,
                duration : 5000
            });
            ngNotify.addType('notice-success','bg-success text-dark');
            ngNotify.addType('notice-danger','bg-danger text-light');
            ngNotify.addType('notice-info','bg-info text-dark');

            if($rootScope.loginCauseError !== undefined && $rootScope.loginCauseError.enabled){
                ngNotify.dismiss();
                ngNotify.set($rootScope.loginCauseError.msg, "notice-danger");
                $rootScope.loginCauseError.enabled = false;
            }

            if($rootScope.loginCauseSuccess !== undefined && $rootScope.loginCauseSuccess.enabled){
                ngNotify.dismiss();
                ngNotify.set($rootScope.loginCauseSuccess.title + $rootScope.loginCauseError.msg, "notice-danger");
                $rootScope.loginCauseSuccess.enabled = false;
            }

            // reset login status
            $rootScope.loginStatus = false;
            $rootScope.user = undefined;
            socketService.disconnectSocket();
            $cookies.remove('userCredentials');
        })();

        function login() {
            vm.dataLoading = true;
            httpService.accountAuthenticate(vm.user)
                .then(function (response) {
                    if (response.success) {
                        $rootScope.user = response.data;
                        $rootScope.user.openedGroupsList = [];
                        $rootScope.user.activeGroup = undefined;
                        $rootScope.loginStatus = true;
                        vm.dataLoading = false;
                        $location.path('/home');
                    } else {
                        vm.dataLoading = false;
                        ngNotify.dismiss();
                        ngNotify.set("Email or password do not matched.", "notice-danger");
                    }
                });
        }
    }

})();
