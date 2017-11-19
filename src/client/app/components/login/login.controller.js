(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$rootScope', '$location', 'loginService', 'md5'];
    function LoginController($rootScope, $location, loginService, md5) {
        var vm = this;

        vm.login = login;
        vm.dataLoading = false;

        (function initController() {
            // reset login status
            $rootScope.loginStatus = false;
            $rootScope.user = undefined;
            loginService.clearCredentials();
        })();

        function login(ev) {
            vm.dataLoading = true;
            loginService.login(vm.email, vm.password)
                .then(function (response) {
                    if (response.success) {
                        loginService.setCredentials(vm.email, md5.createHash(vm.password));
                        $rootScope.user = response.data;
                        $rootScope.loginStatus = true;
                        vm.dataLoading = false;
                        $rootScope.dataLoading = true;
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
