(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$rootScope', '$location', 'homeService', 'dashboardService','socketService', 'httpService', '$timeout', 'notify'];
    function SettingsController($rootScope, $location, homeService, dashboardService, socketService, httpService, $timeout, notify) {
        const vm = this;

        vm.updateGroupName  = _updateGroupName;
        vm.deleteGroup      = _deleteGroup;
        
        (function initController() {
            notify.config({duration:'4000', position:'center'});
            $rootScope.editGroup = {};
            $rootScope.deleteGroup = {};
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(dashboardService.retrieveGroupsName);
        })();

        function _updateGroupName(group) {
            if(group.curName !== group.newName || group.newName.length > 0){
                httpService.groupUpdateName({gID : group.id, gName : group.newName})
                    .then(function (response) {
                        if(response.success){
                            $rootScope.user.groupsNames[group.id] = group.newName;
                            notify({ message:"Group name changed successful to \""+ group.newName +"\"", classes :'bg-dark border-success text-success'});
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
                        notify({ message: "Group \"" + $rootScope.user.groupsNames[gID] + "\" deleted successful", classes :'bg-dark border-success text-success'});
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