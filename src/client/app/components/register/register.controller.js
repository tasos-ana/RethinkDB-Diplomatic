(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['$rootScope', '$location', 'httpService'];
    function RegisterController($rootScope, $location, httpService) {
        const vm = this;

        vm.register             = register;
        vm.accountEmailExists   = accountEmailExists;

        (function initController() {
            vm.dataLoading = false;
            vm.registerComplete = false;
            vm.user = {};
            vm.alert = {enabled : false};
        })();

        function register(valid) {
            if(valid){
                if(vm.user.uPassword === vm.user.uRepeatPassword){
                    vm.dataLoading = true;
                    vm.user.alert.form.enabled = false;
                    httpService.accountCreate(vm.user).then(function (response) {
                            if (response.success) {
                                $rootScope.registerComplete = true;
                                $location.path('/login');
                            } else {
                                vm.dataLoading = false;
                                vm.alert.form.title    = "Form invalid!";
                                vm.alert.form.msg      = " Something goes wrong with registration, try again later";
                                vm.alert.form.enabled  = true;
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