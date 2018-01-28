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
        vm.leaveGroup       = _leaveGroup;

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

            $rootScope.editGroup = {};
            $rootScope.deleteGroup = {};
            $rootScope.leaveGroup = {};

            homeService.retrieveAccountDetails(function () {

            });

            socketService.onAccountDetails();
            socketService.onGroupDetails();
            vm.dataLoading = false;
        })();

        function _updateGroupName(group) {
            if(group.curName !== group.newName || group.newName.length > 0){
                httpService.groupUpdateName({gID : group.id, gName : group.newName})
                    .then(function (response) {
                        if(response.success){
                            $rootScope.user.groupsNames[group.id] = group.newName;
                        }else{
                            $rootScope.loginCauseError.enabled = true;
                            $rootScope.loginCauseError.msg = response.message;
                            $location.path('/login');
                        }
                    });
            }
        }

        function _deleteGroup(gID) {
            socketService.emitDeleteGroup(gID);

            httpService.groupDelete(gID, $rootScope.user.groupsNames[gID])
                .then(function (response) {
                    if(!response.success){
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.message;
                        $location.path('/login');
                    }
                });
        }

        function _leaveGroup(gID) {
            socketService.emitDeleteGroup(gID);

            httpService.groupParticipateLeave(gID, $rootScope.user.groupsNames[gID])
                .then(function (response) {
                   if(!response.success){
                       $rootScope.loginCauseError.enabled = true;
                       $rootScope.loginCauseError.msg = response.message;
                       $location.path('/login');
                   }
                });
        }
    }
})();