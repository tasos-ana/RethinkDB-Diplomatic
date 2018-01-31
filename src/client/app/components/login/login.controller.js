/**
 * Module with functions that required on login Page
 */
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
            vm.dataLoading = true;
            vm.loginCauseError = {};
            vm.loginCauseSuccess = {};

            ngNotify.config({
                sticky  : false,
                duration : 5000
            });
            ngNotify.addType('notice-success','bg-success text-dark');
            ngNotify.addType('notice-danger','bg-danger text-light');
            ngNotify.addType('notice-info','bg-info text-dark');

            if($rootScope.loginCauseError !== undefined && $rootScope.loginCauseError.enabled){
                vm.loginCauseError.title = $rootScope.loginCauseError.title;
                vm.loginCauseError.msg = $rootScope.loginCauseError.msg;
                vm.loginCauseError.enabled = $rootScope.loginCauseError.enabled;
                $rootScope.loginCauseError.enabled = false;
            }

            if($rootScope.loginCauseSuccess !== undefined && $rootScope.loginCauseSuccess.enabled){
                vm.loginCauseSuccess.title = $rootScope.loginCauseSuccess.title;
                vm.loginCauseSuccess.msg = $rootScope.loginCauseSuccess.msg;
                vm.loginCauseSuccess.enabled = $rootScope.loginCauseSuccess.enabled;
                $rootScope.loginCauseSuccess.enabled = false;
            }

            // reset login status
            $rootScope.loginStatus = false;
            $rootScope.user = undefined;
            socketService.disconnectSocket();
            $cookies.remove('userCredentials');
            vm.dataLoading = false;
        })();

        function login() {
            if(vm.user.rememberMe === undefined){
                vm.user.rememberMe = false;
            }
            vm.dataLoading = true;
            httpService.accountAuthenticate(vm.user)
                .then(function (response) {
                    if (response.success) {
                        $rootScope.loginStatus = true;
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
