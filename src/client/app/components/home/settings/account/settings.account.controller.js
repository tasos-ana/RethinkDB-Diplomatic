(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsAccountController', SettingsAccountController);

    SettingsAccountController.$inject = ['$rootScope', '$scope', '$location', 'homeService', 'dashboardService','socketService', 'httpService', '$timeout', 'ngNotify', '$window', 'settingsAccountService'];
    function SettingsAccountController($rootScope, $scope, $location, homeService, dashboardService, socketService, httpService, $timeout, ngNotify, $window, settingsAccountService) {
        const vm = this;

        vm.generateNewAvatar        = _generateNewAvatar;
        vm.updateAccount            = _updateAccount;
        vm.accountSettingsFormReset = _accountSettingsFormReset;

        (function initController() {
            vm.dataLoading = true;
            vm.templateURL = $location.path();

            socketService.connectSocket();

            ngNotify.config({
                sticky   : false,
                duration : 5000
            });
            ngNotify.addType('notice-success','bg-success text-dark');
            ngNotify.addType('notice-danger','bg-danger text-light');
            ngNotify.addType('notice-info','bg-info text-dark');

            vm.accountSettings = {};
            vm.accountSettings.applyChanges = false;

            homeService.retrieveAccountDetails(function () {
                vm.accountSettings.newAvatar = $rootScope.user.usersDetails[$rootScope.user.email].avatar;
            });

            socketService.onAccountDetails();
            socketService.onGroupDetails();

            vm.dataLoading = false;
        })();

        
        function _generateNewAvatar() {
            $timeout(function () {
                $rootScope.$apply(function () {
                    vm.accountSettings.newAvatar = vm.accountSettings.newAvatar.shuffle();
                });
            });
        }

        function _updateAccount() {
            //Clean up
            const newNickname           = vm.accountSettings.newNickname;
            const curPassword           = vm.accountSettings.curPassword;
            const newPassword           = vm.accountSettings.newPassword;
            const confirmNewPassword    = vm.accountSettings.confirmNewPassword;
            let changeNickname  = false;
            let changePassword  = false;
            let changeAvatar    = false;
            let error           = false;
            ngNotify.dismiss();
            if($scope.accountSettingsForm.newNickname.$invalid){
                ngNotify.set("Invalid nickname. Please try again", "notice-danger");
                $window.document.getElementById('newNickname_input').focus();
                error = true;
            }else if(newNickname!==undefined && newNickname.length>0){
                if(curPassword!==undefined && curPassword.length>=8){
                    changeNickname = true;
                }else if($scope.accountSettingsForm.curPassword.$valid){
                    ngNotify.set("Your current password is required", "notice-danger");
                    $window.document.getElementById('curPassword_input').focus();
                    error=true;
                }else{
                    ngNotify.set("Your current password is invalid", "notice-danger");
                    $window.document.getElementById('curPassword_input').focus();
                    error=true
                }
            }

            if($scope.accountSettingsForm.newPassword.$invalid){
                ngNotify.set("Invalid password. Please try again", "notice-danger");
                $window.document.getElementById('newPassword_input').focus();
                error=true;
            }else if($scope.accountSettingsForm.confirmNewPassword.$invalid){
                ngNotify.set("Your passwords don't matched. Please try again", "notice-danger");
                $window.document.getElementById('confirmNewPassword_input').focus();
                error=true;
            }else if(newPassword!==undefined && newPassword.length>0 && confirmNewPassword!==undefined && confirmNewPassword.length>0){
                if(curPassword!==undefined && curPassword.length>0){
                    if(curPassword === newPassword){
                        ngNotify.set("New password can't be the same with your current password. Please try again", "notice-danger");
                        $window.document.getElementById('newPassword_input').focus();
                        error = true;
                    }else{
                        changePassword = true;
                    }
                }else{
                    ngNotify.dismiss();
                    ngNotify.set("Your current password is required", "notice-danger");
                    $window.document.getElementById('curPassword_input').focus();
                    error=true;
                }
            }

            if(vm.accountSettings.newAvatar !== $rootScope.user.usersDetails[$rootScope.user.email].avatar){
                if(curPassword!==undefined && curPassword.length>=8){
                    changeAvatar = true;
                }else if($scope.accountSettingsForm.curPassword.$valid){
                    ngNotify.set("Your current password is required", "notice-danger");
                    $window.document.getElementById('curPassword_input').focus();
                    error=true;
                }else{
                    ngNotify.set("Your current password is invalid", "notice-danger");
                    $window.document.getElementById('curPassword_input').focus();
                    error=true
                }
            }

            if(!error){
                if(changeNickname || changePassword || changeAvatar){
                    settingsAccountService.accountUpdate(vm);
                }
            }
        }

        function _accountSettingsFormReset() {
            // call that on success update
            delete vm.accountSettings;
            vm.accountSettings = {};
            vm.accountSettings.newAvatar = $rootScope.user.usersDetails[$rootScope.user.email].avatar;
            vm.accountSettings.applyChanges = false;
            // $scope.accountSettingsForm.$setPristine();
        }
    }
})();