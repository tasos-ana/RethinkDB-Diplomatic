(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['$rootScope', '$location', 'httpService','$timeout'];
    function RegisterController($rootScope, $location, httpService, $timeout) {
        const vm = this;

        vm.register = register;
        vm.accountEmailExists = accountEmailExists;


        (function initController() {
            vm.dataLoading = false;
            vm.emailExists = false;
            vm.registerComplete = false;
            vm.user = {};
        })();

        function register(ev) {
            if(vm.emailExists){
                $rootScope.showAlert(
                    ev,
                    'Register status',
                    'Your email already exists.',
                    'Register fail',
                    'Got it');
            }else{
                if(vm.user.uPassword === vm.user.uConfirmPassword){
                    vm.dataLoading = true;
                    httpService.accountCreate(vm.user)
                        .then(function (response) {
                            if (response.success) {
                                $rootScope.user = vm.user;
                                vm.registerComplete = true;
                                $timeout(function () {
                                    if($location.path() === '/register'){
                                        $location.path('/login');
                                    }
                                },2000);
                            } else {
                                vm.dataLoading = false;
                                $rootScope.showAlert(
                                    ev,
                                    'Register status',
                                    'Something goes wrong with registration, try again later',
                                    'Register fail',
                                    'Got it');
                            }
                        });
                }
            }
        }
     
        function accountEmailExists(isValid) {
            if(isValid){
                httpService.accountGetUserByEmail(vm.user.uEmail)
                    .then(function (response) {
                       vm.emailExists = response.success;
                    });
            }
        }
        
    }
})();