(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('settingsService', settingsService);

    settingsService.$inject = ['$rootScope', '$location', 'httpService', '$window', 'notify'];
    function settingsService($rootScope, $location, httpService, $window, notify) {
        const service = {};

        service.accountUpdateNickname   = _accountUpdateNickname;
        service.accountUpdatePassword   = _accountUpdatePassword;
        service.accountUpdateAll        = _accountUpdateAll;

        return service;

        function _accountUpdateNickname(vm) {
            vm.applyChanges = true;
            notify({ message:"We trying to update your account nickname, please wait!", classes :'bg-dark border-info text-info'});
            httpService.accountUpdateNickname(vm.accountSettings.curPassword , vm.accountSettings.newNickname)
                .then(function (response) {
                   if(response.success){
                       if(response.data.wrongPassword!==undefined && response.data.wrongPassword){
                           notify({ message:"Your current password it's wrong, please try again.", classes :'bg-dark border-danger text-danger'});
                           $window.document.getElementById('curPassword_input').focus();
                       }else{
                           $rootScope.user.nickname = response.data.nickname;
                           vm.accountSettingsFormReset();
                           notify({ message:"Your nickname changed successful", classes :'bg-dark border-success text-success'});
                       }
                   }else{
                       $location.path('/login');
                   }
                });
        }
        
        function _accountUpdatePassword(vm) {
            vm.applyChanges = true;
            notify({ message:"We trying to update your account password, please wait!", classes :'bg-dark border-info text-info'});
            httpService.accountUpdatePassword(vm.accountSettings.curPassword, vm.accountSettings.newPassword)
                .then(function (response) {
                    if(response.success){
                        if(response.data.wrongPassword!==undefined && response.data.wrongPassword){
                            notify({ message:"Your current password it's wrong, please try again.", classes :'bg-dark border-danger text-danger'});
                            $window.document.getElementById('curPassword_input').focus();
                        }else {
                            vm.accountSettingsFormReset();
                            notify({message: "Your password changed successful", classes: 'bg-dark border-success text-success'});
                        }
                    }else{
                        $location.path('/login');
                    }
                });
        }

        function _accountUpdateAll(vm) {
            vm.applyChanges = true;
            notify({ message:"We trying to update your account details, please wait!", classes :'bg-dark border-info text-info'});
            httpService.accountUpdatePassword(vm.accountSettings.curPassword, vm.accountSettings.newNickname, vm.accountSettings.newPassword)
                .then(function (response) {
                    if(response.success) {
                        if(response.data.wrongPassword!==undefined && response.data.wrongPassword){
                            notify({ message:"Your current password it's wrong, please try again.", classes :'bg-dark border-danger text-danger'});
                            $window.document.getElementById('curPassword_input').focus();
                        }else {
                            $rootScope.user.nickname = response.data.nickname;
                            vm.accountSettingsFormReset();
                            notify({message: "Your nickname and password changed successful",classes: 'bg-dark border-success text-success'});
                        }
                    }else{
                        $location.path('/login');
                    }
                });
        }
    }
})();