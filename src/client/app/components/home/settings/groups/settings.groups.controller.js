(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsGroupsController', SettingsGroupsController);

    SettingsGroupsController.$inject = ['$rootScope', '$scope', '$location', 'homeService', 'dashboardService','socketService', 'httpService', '$timeout', 'ngNotify'];
    function SettingsGroupsController($rootScope, $scope, $location, homeService, dashboardService, socketService, httpService, $timeout, ngNotify) {
        const vm = this;

        vm.updateGroupName  = _updateGroupName;
        vm.deleteGroup      = _deleteGroup;

        (function initController() {
            vm.templateURL = $location.path();
            socketService.connectSocket();

            ngNotify.config({
                sticky   : false,
                duration : 3000
            });
            ngNotify.addType('notice-success','bg-success text-dark');
            ngNotify.addType('notice-danger','bg-danger text-light');
            ngNotify.addType('notice-info','bg-info text-dark');

            $rootScope.editGroup = {};
            $rootScope.deleteGroup = {};

            homeService.retrieveAccountDetails(dashboardService.retrieveGroupsName);

            socketService.onAccountNameChange();
            socketService.onAccountPasswordChange();

            socketService.onGroupCreate();
            socketService.onGroupDelete();
            socketService.onGroupNameChange();
            socketService.onGroupDataBadge();

        })();

        function _updateGroupName(group) {
            if(group.curName !== group.newName || group.newName.length > 0){
                httpService.groupUpdateName({gID : group.id, gName : group.newName})
                    .then(function (response) {
                        if(response.success){
                            $rootScope.user.groupsNames[group.id] = group.newName;
                            ngNotify.dismiss();
                            ngNotify.set("Group name changed successful to \""+ group.newName +"\"", "notice-success");
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

            httpService.groupDelete(gID, $rootScope.user.groupsNames[gID])
                .then(function (response) {
                    if(response.success){
                        ngNotify.dismiss();
                        ngNotify.set("Group \"" + response.data.gName + "\" deleted successful", "notice-success");
                        removeGroup(response.data.gID);
                        delete $rootScope.user.groupsNames[response.data.gID];
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