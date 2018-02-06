(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SignupController', SignupController);

    SignupController.$inject = ['$rootScope', 'httpService', 'ngNotify', '$window', '$timeout', '$location'];
    function SignupController($rootScope, httpService, ngNotify, $window, $timeout, $location) {
        const vm = this;

        vm.register = register;

        (function initController() {
            vm.dataLoading = false;
            vm.user = {};
            vm.alert = {enabled : false};

            ngNotify.config({
                sticky  : false,
                duration : 5000
            });
            ngNotify.addType('notice-success','bg-success text-dark');
            ngNotify.addType('notice-danger','bg-danger text-light');
            ngNotify.addType('notice-info','bg-info text-dark');
        })();

        function register(valid) {
            if(valid){
                if(vm.user.uPassword === vm.user.uRepeatPassword){
                    vm.dataLoading = true;
                    vm.alert.enabled = false;
                    httpService.accountCreate(vm.user).then(function (response) {
                            if (response.success) {
                                ngNotify.dismiss();
                                ngNotify.set("Register complete! Automatic redirect to login page in 3sec...", "notice-success");
                                $timeout(function () {
                                    if($location.path()==='/signup'){
                                        $window.location.href = '/login';
                                    }
                                },3000);
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