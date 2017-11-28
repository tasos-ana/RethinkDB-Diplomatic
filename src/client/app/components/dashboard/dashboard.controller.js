(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'httpService','dashboardService', '$mdDialog'];
    function DashboardController($rootScope, $location, httpService, dashboardService, $mdDialog) {
        const vm = this;

        vm.uploadData       = uploadData;
        vm.groupCreate      = groupCreate;
        vm.groupSettings    = groupSettings;

        (function initController() {
            $rootScope.dataLoading = true;
            if($rootScope.user === undefined || $rootScope.user ===null){
                httpService.accountGetUserByEmail($rootScope.globals.currentUser.email)
                    .then(function (response) {
                        $rootScope.dataLoading = false;
                        if(response.success){
                            $rootScope.user = response.data;
                            dashboardService.getAccountGroups();
                        }else{
                            $location.path('/login');
                        }
                    });
            }else{
                $rootScope.dataLoading = false;
                dashboardService.getAccountGroups();
            }
        })();

        function uploadData(gID) {
            $rootScope.user.groupsData[gID].upload.uploadData = true;

            if($rootScope.user.groupsData[gID].upload.data.length>0){

                $rootScope.user.groupsData[gID].upload.gID = $rootScope.user.groupsData[gID].id;
                $rootScope.user.groupsData[gID].upload.type = 'text';
                $rootScope.user.groupsData[gID].upload.time = Date.now();

                httpService.groupAddData($rootScope.user.groupsData[gID].upload)
                    .then(function (response) {
                        if(response.success){
                            $rootScope.user.groupsData[gID].upload = {
                                data    : '',
                                type    : '',
                                time    : '',
                                table   : ''
                            };
                            $rootScope.user.groupsData[gID].upload.uploadData = false;
                        } else{
                            $location.path('/login');
                        }
                });
            }else{
                $rootScope.user.groupsData[gID].upload.uploadData = false;
            }
        }

        function groupCreate() {
            const curUser = $rootScope.globals.currentUser;
            if(curUser === undefined){
                $location.path('/login');
            }
            vm.group.creating = true;
            httpService.groupCreate({uEmail : curUser.email, gName : vm.group.name})
                .then(function (response) {
                    if(response.success){
                        $rootScope.user.groupsList.push(response.data.gID);
                        $rootScope.user.groupsData[response.data.gID] = {id: response.data.gID, name: response.data.gName};
                        dashboardService.getAccountGroups();
                        vm.group.creating = false;
                        vm.group.name = '';
                    }
                });
        }

        function groupSettings(gID,ev) {
            $rootScope.group = {
                id      : gID,
                curName : $rootScope.user.groupsData[gID].name,
                newName : undefined
            };

            $mdDialog.show({
                controller          :   groupSettingsController,
                templateUrl         :   './app/components/dashboard/templates/groupSettings.tpl.html',
                parent              :   angular.element(document.body),
                targetEvent         :   ev,
                clickOutsideToClose :   true,
                fullscreen          :   false
            }).then(function (answer) {
                if(answer === 'delete'){
                    httpService.groupDelete(gID)
                        .then(function (response) {
                           if(response.success){
                               removeGroup(gID);
                               delete $rootScope.user.groupsData[gID];
                               delete $rootScope.group;
                           }else{
                               $location.path('/login');
                           }
                        });
                }else{
                    console.log('new name + ' + $rootScope.group.newName);
                    console.log('apply');
                }
            },function () {
                $rootScope.group = undefined;
                console.log('cancel');
            });
        }

        function groupSettingsController($scope, $mdDialog) {
            $scope.group = $rootScope.group;

            $scope.cancelChanges = cancelChanges;
            $scope.applyChanges  = applyChanges;
            $scope.deleteGroup   = deleteGroup;


            function cancelChanges() {
                $mdDialog.cancel();
            }

            function applyChanges() {
                $rootScope.group.newName = $scope.group.newName;
                $mdDialog.hide('changes');
            }

            function deleteGroup() {
                $mdDialog.hide('delete');
            }
        }

        function removeGroup(gID){
            const index = $rootScope.user.groupsList.indexOf(gID);
            if (index >= 0) {
                $rootScope.user.groupsList.splice(index, 1);
            }
        }

    }
})();