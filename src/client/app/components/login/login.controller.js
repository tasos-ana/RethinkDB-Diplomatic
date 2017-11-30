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

            // reset login status
            $rootScope.loginStatus = false;
            $rootScope.user = undefined;

            loginService.clearCredentials();
        })();

        function login(ev) {
            vm.dataLoading = true;
            httpService.accountAuthenticate(vm.user)
                .then(function (response) {
                    if (response.success) {
                        $rootScope.user = response.data;
                        $rootScope.loginStatus = true;
                        vm.dataLoading = false;
                        $location.path('/dashboard');
                    } else {
                        vm.dataLoading = false;
                        $rootScope.showAlert(
                            ev,
                            'Login status',
                            'Email or password do not matched.',
                            'Login fail',
                            'Got it');
                    }
                });
        }
    }

})();
