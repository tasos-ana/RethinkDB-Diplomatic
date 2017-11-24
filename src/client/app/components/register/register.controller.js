(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['$rootScope', '$location', 'httpService'];
    function RegisterController($rootScope, $location, httpService) {
        var vm = this;

        vm.register = register;
        vm.validateEmail = validateEmail;

        vm.dataLoading = false;
        vm.emailExists = false;

        function register(ev) {
            if(vm.emailExists){
                $rootScope.showAlert(
                    ev,
                    'Register status',
                    'Your email already exists.',
                    'Register fail',
                    'Got it');
            }else{
                vm.dataLoading = true;
                httpService.accountCreate(vm.user)
                    .then(function (response) {
                        if (response.success) {
                            $rootScope.user = vm.user;
                            vm.dataLoading = false;
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
     
        function validateEmail(valid) {
            if(valid){
                httpService.accountGetUserByEmail(vm.user.uEmail)
                    .then(function (response) {
                       vm.emailExists = response.success;
                    });
            }
        }
        
    }
})();