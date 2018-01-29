(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsGroupsController', SettingsGroupsController);

    SettingsGroupsController.$inject = ['$rootScope', '$scope', '$location', 'homeService', 'dashboardService','socketService', 'httpService', '$timeout', 'ngNotify'];
    function SettingsGroupsController($rootScope, $scope, $location, homeService, dashboardService, socketService, httpService, $timeout, ngNotify) {
        const vm = this;

        vm.updateGroupName      = _updateGroupName;
        vm.deleteGroup          = _deleteGroup;
        vm.leaveGroup           = _leaveGroup;
        vm.removeParticipant    = _removeParticipant;

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
            $rootScope.editParticipants = {};

            homeService.retrieveAccountDetails(function () {
                //Function to retrieve the participants per group
                $rootScope.user.groupsParticipants = {};
                for(let i=0; i<$rootScope.user.groupsList.length; ++i){
                    let gID = $rootScope.user.groupsList[i];
                    httpService.retrieveGroupParticipants(gID)
                        .then(function (response) {
                           if(response.success){
                               $rootScope.user.groupsParticipants[response.data.gID] = response.data.participants;
                           }
                        });
                }
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

            httpService.groupDelete(gID)
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

            httpService.groupParticipateLeave(gID)
                .then(function (response) {
                   if(!response.success){
                       $rootScope.loginCauseError.enabled = true;
                       $rootScope.loginCauseError.msg = response.message;
                       $location.path('/login');
                   }
                });
        }

        function _removeParticipant(gID) {
            httpService.groupRemoveParticipant($rootScope.editParticipants.user, gID)
                .then(function (response) {
                   if(response.success){
                       const index = $rootScope.user.groupsParticipants[response.data.gID].indexOf(response.data.uEmail);
                       if(index !== -1 ){
                           $rootScope.user.groupsParticipants[response.data.gID].splice(index,1);
                       }
                       $rootScope.editParticipants.user = undefined;
                   }else{
                       $rootScope.loginCauseError.enabled = true;
                       $rootScope.loginCauseError.msg = response.message;
                       $location.path('/login');
                   }
                });
        }
    }
})();