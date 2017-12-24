(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$rootScope', '$location', 'homeService', 'dashboardService','socketService', 'httpService', '$timeout'];
    function SettingsController($rootScope, $location, homeService, dashboardService, socketService, httpService, $timeout) {
        const vm = this;

        vm.updateGroupName  = _updateGroupName;
        vm.deleteGroup      = _deleteGroup;
        
        (function initController() {
            $rootScope.editGroup = {};
            $rootScope.deleteGroup = {};
            $rootScope.alert = {};
            $rootScope.alert.enabled = false;
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(dashboardService.retrieveGroupsName);
        })();

        function _updateGroupName(group) {
            if(group.curName !== group.newName || group.newName.length > 0){
                httpService.groupUpdateName({gID : group.id, gName : group.newName})
                    .then(function (response) {
                        if(response.success){
                            $rootScope.user.groupsNames[group.id] = group.newName;
                            $rootScope.alert.msg = 'Group name changed to ';
                            $rootScope.alert.name =  group.newName;
                            $rootScope.alert.enabled = true;
                            $timeout(function () {
                                $rootScope.alert.enabled = false;
                            },5000);
                        }else{
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
                        $rootScope.alert.msg = 'Delete complete for group ';
                        $rootScope.alert.name = $rootScope.user.groupsNames[gID];
                        $rootScope.alert.enabled = true;
                        $timeout(function () {
                            $rootScope.alert.enabled = false;
                        },5000);
                        removeGroup(gID);
                        delete $rootScope.user.groupsNames[gID];
                    }else{
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