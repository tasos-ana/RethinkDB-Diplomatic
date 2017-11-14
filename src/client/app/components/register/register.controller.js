(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['$rootScope', '$scope', '$location', 'registerService','md5'];
    function RegisterController($rootScope,$scope, $location, registerService, md5) {
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
                vm.user.password = md5.createHash(vm.user.password || '');
                registerService.create(vm.user)
                    .then(function (response) {
                        if (response.success) {
                            $rootScope.user = vm.user;
                            vm.user = null;
                            $rootScope.showAlert(
                                ev,
                                'Register status',
                                'Register complete!',
                                'Register complete',
                                'Log in');
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
                registerService.userByEmail(vm.user.email)
                    .then(function (response) {
                       vm.emailExists = !response.success;
                    });
            }
        }
        
    }
})();