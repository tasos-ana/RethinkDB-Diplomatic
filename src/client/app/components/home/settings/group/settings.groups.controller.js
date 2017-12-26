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

            $rootScope.editGroup = {};
            $rootScope.deleteGroup = {};

            socketService.onGroupNameChange(function () {
                //todo
            });

            socketService.onGroupCreate(function () {
                //todo
            });

            socketService.onGroupDelete(function () {
               //todo
            });

            socketService.onAccountNameChange(function () {
                //todo
            });

            socketService.onAccountPasswordChange(function () {
                //todo
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