(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$rootScope', '$location', 'loginService', 'httpService'];
    function LoginController($rootScope, $location, loginService, httpService) {
        const vm = this;

        vm.login = login;

        (function initController() {
            vm.dataLoading = false;
            vm.loginError = false;

            if($rootScope.registerComplete){
                vm.registerComplete = true;
                $rootScope.registerComplete = false;
            }else{
                vm.registerComplete = false;
            }

            // reset login status
            $rootScope.loginStatus = false;
            $rootScope.user = undefined;

            loginService.clearCredentials();
        })();

        function login() {
            vm.dataLoading = true;
            httpService.accountAuthenticate(vm.user)
                .then(function (response) {
                    if (response.success) {
                        $rootScope.user = response.data;
                        $rootScope.user.groupsOpened = [];
                        $rootScope.user.activeGroup = undefined;
                        $rootScope.loginStatus = true;
                        vm.dataLoading = false;
                        vm.loginError = false;
                        $location.path('/home');
                    } else {
                        vm.dataLoading = false;
                        vm.loginError = true;
                    }
                });
        }
    }

})();
