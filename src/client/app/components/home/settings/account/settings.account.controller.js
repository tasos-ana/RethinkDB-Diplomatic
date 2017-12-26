(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsAccountController', SettingsAccountController);

    SettingsAccountController.$inject = ['$rootScope', '$scope', '$location', 'homeService', 'dashboardService','socketService', 'httpService', '$timeout', 'notify', '$window', 'settingsAccountService'];
    function SettingsAccountController($rootScope, $scope, $location, homeService, dashboardService, socketService, httpService, $timeout, notify, $window, settingsAccountService) {
        const vm = this;

        vm.updateAccount                    = _updateAccount;
        vm.accountSettingsFormReset         = _accountSettingsFormReset;

        (function initController() {
            vm.templateURL = $location.path();
            notify.config({duration:'4000', position:'center'});

            socketService.connectSocket();

            vm.accountSettings = {};
            vm.accountSettings.applyChanges = false;

            homeService.retrieveAccountDetails(dashboardService.retrieveGroupsName);

            socketService.onAccountNameChange(function (newNickname) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if($rootScope.user.nickname !== newNickname){
                            $rootScope.user.nickname = newNickname;
                            notify({ message:"Your nickname change to '" + newNickname +"' from another device.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onAccountPasswordChange(function (newPassword) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if($rootScope.user.password !== newPassword){
                            $rootScope.user.password = newPassword;
                            $rootScope.loginCauseSuccess.title      = ' Password change ';
                            $rootScope.loginCauseSuccess.msg        = ' from another device. Please login again!';
                            $rootScope.loginCauseSuccess.enabled    = true;
                            $location.path('/login');
                        }
                    });
                });
            });

            socketService.onGroupCreate(function (gID, gName) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(gID);
                        if(index === -1){
                            $rootScope.user.groupsList.push(gID);
                            $rootScope.user.groupsNames[gID] = gName;
                            notify({ message:"New group created with name '" + gName +"'.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onGroupDelete(function (gID) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(gID);
                        if(index >= -1){
                            $rootScope.user.groupsList.splice(index, 1);
                            delete $rootScope.user.groupsNames[gID];
                            notify({ message:"The group with name '" + gName +"' deleted.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onGroupNameChange(function (gID, gName) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(gID);
                        const prevName = $rootScope.user.groupsNames[gID];
                        if(index === -1 && prevName!==gName){
                            $rootScope.user.groupsList.push(gID);
                            $rootScope.user.groupsNames[gID] = gName;
                            notify({ message:"Group name change from '" + gName +"' to '" + prevName +"'.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onGroupDataBadge(function () {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        //todo
                    });
                });
            });

        })();

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
                    settingsAccountService.accountUpdateAll(vm);
                }else if(changeNickname){
                    settingsAccountService.accountUpdateNickname(vm);
                }else if(changePassword){
                    settingsAccountService.accountUpdatePassword(vm);
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