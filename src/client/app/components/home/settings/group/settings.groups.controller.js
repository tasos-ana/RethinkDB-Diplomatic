(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsGroupsController', SettingsGroupsController);

    SettingsGroupsController.$inject = ['$rootScope', '$scope', '$location', 'homeService', 'dashboardService','socketService', 'httpService', '$timeout', 'notify'];
    function SettingsGroupsController($rootScope, $scope, $location, homeService, dashboardService, socketService, httpService, $timeout, notify) {
        const vm = this;

        vm.updateGroupName  = _updateGroupName;
        vm.deleteGroup      = _deleteGroup;

        (function initController() {
            vm.templateURL = $location.path();
            notify.config({duration:'4000', position:'center'});

            socketService.connectSocket();

            $rootScope.editGroup = {};
            $rootScope.deleteGroup = {};

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
            socketService.emitDeleteGroup(gID);

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
    }
})();