(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('settingsAccountService', settingsAccountService);

    settingsAccountService.$inject = ['$rootScope', '$location', 'httpService', '$window', 'ngNotify', 'md5'];
    function settingsAccountService($rootScope, $location, httpService, $window, ngNotify, md5) {
        const service = {};

        service.accountUpdate           = _accountUpdate;

        return service;

        function _accountUpdate(vm) {
            vm.applyChanges = true;
            ngNotify.dismiss();
            ngNotify.set("We trying to update your account details, please wait!", "notice-info");
            if(vm.accountSettings.newPassword !== undefined){
                $rootScope.user.password = md5(vm.accountSettings.newPassword || '');
            }

            httpService.accountUpdate(vm.accountSettings)
                .then(function (response) {
                    if(response.success) {
                        if(response.data.wrongPassword!==undefined && response.data.wrongPassword){
                            $rootScope.user.password = undefined;
                            ngNotify.dismiss();
                            ngNotify.set("Your current password it's wrong, please try again.", "notice-danger");
                            $window.document.getElementById('curPassword_input').focus();
                        }else {
                            vm.accountSettingsFormReset();
                            ngNotify.dismiss();
                            ngNotify.set("Your account details updated", "notice-success");
                        }
                    }else{
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.message;
                        $location.path('/login');
                    }
                });
        }

    }
})();