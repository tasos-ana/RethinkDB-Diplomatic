(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['$rootScope', '$location', 'httpService', 'ngNotify'];
    function RegisterController($rootScope, $location, httpService, ngNotify) {
        const vm = this;

        vm.register = register;

        (function initController() {
            vm.dataLoading = false;
            vm.user = {};
            vm.alert = {enabled : false};
        })();

        function register(valid) {
            if(valid){
                if(vm.user.uPassword === vm.user.uRepeatPassword){
                    vm.dataLoading = true;
                    vm.alert.enabled = false;
                    httpService.accountCreate(vm.user).then(function (response) {
                            if (response.success) {
                                $rootScope.loginCauseSuccess.title      = 'Register complete!';
                                $rootScope.loginCauseSuccess.msg        = ' You can now login!';
                                $rootScope.loginCauseSuccess.enabled    = true;

                                $location.path('/login');
                            } else {
                                vm.dataLoading = false;
                                ngNotify.dismiss();
                                ngNotify.set("Something goes wrong with registration, try again later.", "notice-danger");
                            }
                        });
                }
            }
        }
        
    }
})();