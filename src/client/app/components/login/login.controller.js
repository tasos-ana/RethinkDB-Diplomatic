(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$location', 'AuthenticationService','$mdDialog'];
    function LoginController($location, AuthenticationService,$mdDialog) {
        var vm = this;

        vm.login = login;
        vm.dataLoading = false;
        vm.loginStatus = false;

        (function initController() {
            // reset login status
            AuthenticationService.ClearCredentials();
        })();

        function login(ev) {
            vm.dataLoading = true;
            AuthenticationService.Login(vm.email, vm.password)
                .then(function (response) {
                    if (response.success) {
                        AuthenticationService.SetCredentials(vm.email, vm.password);
                        vm.user = response.data;
                        vm.loginStatus = true;
                        vm.dataLoading = false;
                        $location.path('/dashboard');
                    } else {
                        vm.dataLoading = false;
                        showAlert(ev);
                    }
                });
        }

        function showAlert(ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            // Modal dialogs should fully cover application
            // to prevent interaction outside of dialog
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Login failed')
                    .textContent('Your email or password it\'s incorrect.')
                    .ariaLabel('Login failed alert')
                    .ok('Got it!')
                    .targetEvent(ev)
            );
        };

    }

})();
