(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$rootScope', '$location', 'httpService', 'notify', '$cookies', 'socketService'];
    function LoginController($rootScope, $location, httpService, notify, $cookies, socketService) {
        const vm = this;

        vm.login = login;

        (function initController() {
            notify.config({duration:'7000', position:'center'});
            vm.dataLoading = false;

            vm.registerComplete = false;
            vm.loginCauseError = {enabled : false, msg : ''};
            vm.loginCauseSuccess = {enabled : false, msg : '', title : ''};

            if($rootScope.registerComplete){
                vm.registerComplete = true;
                $rootScope.registerComplete = false;
            }

            if($rootScope.loginCauseError !== undefined && $rootScope.loginCauseError.enabled){
                vm.loginCauseError.enabled = true;
                vm.loginCauseError.msg = $rootScope.loginCauseError.msg;
                $rootScope.loginCauseError.enabled = false;
            }

            if($rootScope.loginCauseSuccess !== undefined && $rootScope.loginCauseSuccess.enabled){
                vm.loginCauseSuccess.enabled = true;
                vm.loginCauseSuccess.msg = $rootScope.loginCauseSuccess.msg;
                vm.loginCauseSuccess.title = $rootScope.loginCauseSuccess.title;
                $rootScope.loginCauseSuccess.enabled = false;
            }

            // reset login status
            $rootScope.loginStatus = false;
            $rootScope.user = undefined;
            socketService.disconnectSocket();
            $cookies.remove('userCredentials');
        })();

        function login() {
            vm.dataLoading = true;
            httpService.accountAuthenticate(vm.user)
                .then(function (response) {
                    if (response.success) {
                        $rootScope.user = response.data;
                        $rootScope.user.openedGroupsList = [];
                        $rootScope.user.activeGroup = undefined;
                        $rootScope.loginStatus = true;
                        vm.dataLoading = false;
                        $location.path('/home');
                    } else {
                        vm.dataLoading = false;
                        notify({ message:"Email or password do not matched.", classes :'bg-dark border-danger text-danger'});
                    }
                });
        }
    }

})();
