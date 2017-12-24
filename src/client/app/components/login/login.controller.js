(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$rootScope', '$location', 'loginService', 'httpService', 'notify'];
    function LoginController($rootScope, $location, loginService, httpService, notify) {
        const vm = this;

        vm.login = login;

        (function initController() {
            notify.config({duration:'10000', position:'center'});
            vm.dataLoading = false;
            vm.loginError = false;

            if($rootScope.registerComplete){
                notify({ message:"Register complete!", classes :'bg-dark border-success text-success'});
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
                        $rootScope.user.openedGroupsList = [];
                        $rootScope.user.activeGroup = undefined;
                        $rootScope.loginStatus = true;
                        vm.dataLoading = false;
                        vm.loginError = false;
                        $location.path('/home');
                    } else {
                        vm.dataLoading = false;
                        notify({ message:"Email or password do not matched.", classes :'bg-dark border-danger text-danger'});
                    }
                });
        }
    }

})();
