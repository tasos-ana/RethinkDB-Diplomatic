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
            vm.registerComplete = false;
            vm.user = {};
            vm.alert = {};
            vm.alert.enabled = false;

        })();

        function register() {
            if(vm.emailExists){
                vm.alert.title  = "Form invalid";
                vm.alert.msg    = " Your email address already exists";
                vm.alert.enabled = true;
            }else{
                if(vm.user.uPassword === vm.user.uConfirmPassword){
                    vm.dataLoading = true;
                    vm.alert.enabled = false;
                    httpService.accountCreate(vm.user).then(function (response) {
                            if (response.success) {
                                $rootScope.registerComplete = true;
                                $location.path('/login');
                            } else {
                                vm.dataLoading = false;
                                vm.alert.title  = "Form invalid!";
                                vm.alert.msg    = " Something goes wrong with registration, try again later";
                                vm.alert.enabled = true;
                            }
                        });
                }
            }
        }
     
        function accountEmailExists(isValid) {
            if(isValid){
                httpService.accountGetUserInfo(vm.user.uEmail)
                    .then(function (response) {
                       vm.emailExists = response.success;
                    });
            }
        }
        
    }
})();