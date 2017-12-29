(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('settingsAccountService', settingsAccountService);

    settingsAccountService.$inject = ['$rootScope', '$location', 'httpService', '$window', 'ngNotify', 'md5'];
    function settingsAccountService($rootScope, $location, httpService, $window, ngNotify, md5) {
        const service = {};

        service.accountUpdateNickname   = _accountUpdateNickname;
        service.accountUpdatePassword   = _accountUpdatePassword;
        service.accountUpdateAll        = _accountUpdateAll;

        return service;

        function _accountUpdateNickname(vm) {
            vm.applyChanges = true;
            ngNotify.dismiss();
            ngNotify.set("We trying to update your account nickname, please wait!", "notice-info");
            httpService.accountUpdateNickname(vm.accountSettings.curPassword , vm.accountSettings.newNickname)
                .then(function (response) {
                    if(response.success){
                        if(response.data.wrongPassword!==undefined && response.data.wrongPassword){
                            ngNotify.dismiss();
                            ngNotify.set("Your current password it's wrong, please try again.", "notice-danger");
                            $window.document.getElementById('curPassword_input').focus();
                        }else{
                            $rootScope.user.nickname = response.data.nickname;
                            vm.accountSettingsFormReset();
                            ngNotify.dismiss();
                            ngNotify.set("Your nickname changed successful", "notice-success");
                        }
                    }else{
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.msg;
                        $location.path('/login');
                    }
                });
        }

        function _accountUpdatePassword(vm) {
            vm.applyChanges = true;
            ngNotify.dismiss();
            ngNotify.set("We trying to update your account password, please wait!", "notice-info");
            $rootScope.user.password = md5.createHash(vm.accountSettings.newPassword || '');
            httpService.accountUpdatePassword(vm.accountSettings.curPassword, vm.accountSettings.newPassword)
                .then(function (response) {
                    if(response.success){
                        if(response.data.wrongPassword!==undefined && response.data.wrongPassword){
                            $rootScope.user.password = undefined;
                            ngNotify.dismiss();
                            ngNotify.set("Your current password it's wrong, please try again.", "notice-danger");
                            $window.document.getElementById('curPassword_input').focus();
                        }else {
                            vm.accountSettingsFormReset();
                            ngNotify.dismiss();
                            ngNotify.set("Your password changed successful", "notice-success");
                        }
                    }else{
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.msg;
                        $location.path('/login');
                    }
                });
        }

        function _accountUpdateAll(vm) {
            vm.applyChanges = true;
            ngNotify.dismiss();
            ngNotify.set("We trying to update your account details, please wait!", "notice-info");
            $rootScope.user.password = md5.createHash(vm.accountSettings.newPassword || '');
            httpService.accountUpdateAll(vm.accountSettings.curPassword, vm.accountSettings.newNickname, vm.accountSettings.newPassword)
                .then(function (response) {
                    if(response.success) {
                        if(response.data.wrongPassword!==undefined && response.data.wrongPassword){
                            $rootScope.user.password = undefined;
                            ngNotify.dismiss();
                            ngNotify.set("Your current password it's wrong, please try again.", "notice-danger");
                            $window.document.getElementById('curPassword_input').focus();
                        }else {
                            $rootScope.user.nickname = response.data.nickname;
                            vm.accountSettingsFormReset();
                            ngNotify.dismiss();
                            ngNotify.set("Your nickname and password changed successful", "notice-success");
                        }
                    }else{
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.msg;
                        $location.path('/login');
                    }
                });
        }
    }
})();