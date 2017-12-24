(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['$rootScope', '$location', 'httpService', 'notify', '$timeout'];
    function RegisterController($rootScope, $location, httpService, notify, $timeout) {
        const vm = this;

        vm.register = register;

        (function initController() {
            notify.config({duration:'5000', position:'center'});
            vm.dataLoading = false;
            vm.registerComplete = false;
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
                                $rootScope.registerComplete = true;
                                $location.path('/login');
                            } else {
                                vm.dataLoading = false;
                                notify({ message:"Something goes wrong with registration, try again later", classes :'bg-dark border-danger text-danger'});
                            }
                        });
                }
            }
        }
        
    }
})();