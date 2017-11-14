(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['$rootScope', '$location', 'UserService'];
    function RegisterController($rootScope, $location, UserService) {
        var vm = this;

        vm.register = register;
        vm.dataLoading = false;

        function register(ev) {
            vm.dataLoading = true;
            UserService.Create(vm.user)
                .then(function (response) {
                    if (response.success) {
                        $rootScope.user = vm.user;
                        $location.path('/login');
                    } else {
                        $rootScope.showAlert(
                            ev,
                            'Register status',
                            'Something goes wrong with registration, try again later',
                            'Register fail',
                            'Got it');
                        vm.dataLoading = false;
                    }
                });
        }
    }

})();