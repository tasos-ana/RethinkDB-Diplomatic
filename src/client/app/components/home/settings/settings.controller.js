(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$rootScope', '$scope', '$location', 'homeService', 'dashboardService','socketService', 'httpService', '$timeout', 'notify', '$window', 'settingsService'];
    function SettingsController($rootScope, $scope, $location, homeService, dashboardService, socketService, httpService, $timeout, notify, $window, settingsService) {
        const vm = this;

        vm.updateGroupName                  = _updateGroupName;
        vm.deleteGroup                      = _deleteGroup;

        vm.updateAccount                    = _updateAccount;
        vm.accountSettingsFormReset         = _accountSettingsFormReset;

        (function initController() {
            vm.templateURL = $location.path();
            notify.config({duration:'4000', position:'center'});

            //Required for group settings
            $rootScope.editGroup = {};
            $rootScope.deleteGroup = {};


            //Required for account settings
            vm.accountSettings = {};
            vm.accountSettings.applyChanges = false;

            homeService.retrieveAccountDetails(dashboardService.retrieveGroupsName);
        })();


        // Required for groups.settings.view

        function _updateGroupName(group) {
            if(group.curName !== group.newName || group.newName.length > 0){
                httpService.groupUpdateName({gID : group.id, gName : group.newName})
                    .then(function (response) {
                        if(response.success){
                            $rootScope.user.groupsNames[group.id] = group.newName;
                            notify({ message:"Group name changed successful to \""+ group.newName +"\"", classes :'bg-dark border-success text-success'});
                        }else{
                            $rootScope.loginCauseError.enabled = true;
                            $rootScope.loginCauseError.msg = response.msg;
                            $location.path('/login');
                        }
                    });
            }
        }

        function _deleteGroup(gID) {
            socketService.deleteGroup(gID);
            httpService.groupDelete(gID)
                .then(function (response) {
                    if(response.success){
                        notify({ message: "Group \"" + $rootScope.user.groupsNames[gID] + "\" deleted successful", classes :'bg-dark border-success text-success'});
                        removeGroup(gID);
                        delete $rootScope.user.groupsNames[gID];
                    }else{
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.msg;
                        $location.path('/login');
                    }
                });
        }

        function removeGroup(gID){
            const index = $rootScope.user.groupsList.indexOf(gID);
            if (index >= 0) {
                $rootScope.user.groupsList.splice(index, 1);
            }
        }


        //Required for account.settings.view

        function _updateAccount() {
            //Clean up
            const newNickname           = vm.accountSettings.newNickname;
            const curPassword           = vm.accountSettings.curPassword;
            const newPassword           = vm.accountSettings.newPassword;
            const confirmNewPassword    = vm.accountSettings.confirmNewPassword;
            let changeNickname  = false;
            let changePassword  = false;
            let error           = false;
            if($scope.accountSettingsForm.newNickname.$invalid){
                notify({ message:"Invalid nickname. Please try again", classes :'bg-dark border-danger text-danger'});
                $window.document.getElementById('newNickname_input').focus();
                error = true;
            }else if(newNickname!==undefined && newNickname.length>0){
                if(curPassword!==undefined && curPassword.length>=8){
                    changeNickname = true;
                }else if($scope.accountSettingsForm.curPassword.$valid){
                    notify({ message:"Your current password is required", classes :'bg-dark border-danger text-danger'});
                    $window.document.getElementById('curPassword_input').focus();
                    error=true;
                }else{
                    notify({ message:"Your current password is invalid", classes :'bg-dark border-danger text-danger'});
                    $window.document.getElementById('curPassword_input').focus();
                    error=true
                }
            }

            if($scope.accountSettingsForm.newPassword.$invalid){
                notify({ message:"Invalid password. Please try again", classes :'bg-dark border-danger text-danger'});
                $window.document.getElementById('newPassword_input').focus();
                error=true;
            }else if($scope.accountSettingsForm.confirmNewPassword.$invalid){
                notify({ message:"Your passwords don't matched. Please try again", classes :'bg-dark border-danger text-danger'});
                $window.document.getElementById('confirmNewPassword_input').focus();
                error=true;
            }else if(newPassword!==undefined && newPassword.length>0 && confirmNewPassword!==undefined && confirmNewPassword.length>0){
                if(curPassword!==undefined && curPassword.length>0){
                    if(curPassword === newPassword){
                        notify({ message:"New password can't be the same with your current password. Please try again", classes :'bg-dark border-danger text-danger'});
                        $window.document.getElementById('newPassword_input').focus();
                        error = true;
                    }else{
                        changePassword = true;
                    }
                }else{
                    notify({ message:"Your current password is required", classes :'bg-dark border-danger text-danger'});
                    $window.document.getElementById('curPassword_input').focus();
                    error=true;
                }
            }

            if(!error){
                if(changeNickname && changePassword){
                    settingsService.accountUpdateAll(vm);
                }else if(changeNickname){
                    settingsService.accountUpdateNickname(vm);
                }else if(changePassword){
                    settingsService.accountUpdatePassword(vm);
                }else{
                    notify({ message:"You are happy with your details. No changes was made on your account", classes :'bg-dark border-success text-success'});
                }
            }
        }
        
        function _accountSettingsFormReset() {
            // call that on success update
            delete vm.accountSettings;
            vm.accountSettings = {};
            vm.accountSettings.applyChanges = false;
            $scope.accountSettingsForm.$setPristine();
        }
    }
})();