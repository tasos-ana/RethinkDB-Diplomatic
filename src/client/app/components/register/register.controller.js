(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['$rootScope', '$location', 'httpService'];
    function RegisterController($rootScope, $location, httpService) {
        const vm = this;

        vm.register = register;
        vm.accountEmailExists = accountEmailExists;


        (function initController() {
            vm.dataLoading = false;
            vm.emailExists = false;
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
                vm.dataLoading = true;
                httpService.accountCreate(vm.user)
                    .then(function (response) {
                        if (response.success) {
                            //TODO na emfanizete minima oti egine register
                            $rootScope.user = vm.user;
                            $location.path('/login');
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