(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'httpService','dashboardService', 'socketService', '$timeout'];
    function DashboardController($rootScope, $location, httpService, dashboardService, socketService, $timeout) {
        const vm = this;

        vm.uploadData       = uploadData;
        vm.groupCreate      = groupCreate;
        // vm.groupSettings    = groupSettings;
        vm.groupOpen        = groupOpen;
        vm.groupClose       = groupClose;
        vm.groupSetActive   = groupSetActive;

        (function initController() {
            socketService.connect();
            $rootScope.dataLoading = true;
            vm.createGroupFadeIn = false;
            vm.sidebarToggled = false;
            vm.templateURL = $location.path();
            vm.myGroupsExpand = false;
            if($rootScope.user === undefined || $rootScope.user ===null){
                httpService.accountGetUserInfo(undefined)
                    .then(function (response) {
                        $rootScope.dataLoading = false;
                        if(response.success){
                            $rootScope.user = response.data;
                            $rootScope.user.groupsOpened = [];
                            $rootScope.user.activeGroup = undefined;
                            dashboardService.getAccountGroups();
                        }else{
                            $location.path('/login');
                        }

                        //on listen add or delete group
                        socketService.on($rootScope.user.email, function (data) {
                            $timeout(function () {
                                $rootScope.$apply(function () {
                                    if(data.action === 'deleteGroup'){
                                        removeGroup(data.gID);
                                        delete $rootScope.user.groupsData[data.gID];
                                    }else{
                                        if(!groupExists(data.gID)){
                                            $rootScope.user.groupsList.push(data.gID);
                                            dashboardService.getAccountGroups();
                                        }
                                    }
                                });
                            });
                        });
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

        function groupCreate(isValid) {
            if(isValid){
                vm.group.creating = true;
                httpService.groupCreate(vm.group.name)
                    .then(function (response) {
                        if(response.success){
                            if(!groupExists(response.data.gID)){
                                $rootScope.user.groupsList.push(response.data.gID);
                                dashboardService.getAccountGroups();
                            }
                            vm.group.creating = false;
                            vm.group.name = '';
                        }
                    });
            }
        }

        function groupOpen(gID) {
            $timeout(function () {
                $rootScope.$apply(function () {
                    const index = $rootScope.user.groupsOpened.indexOf(gID);
                    if (index < 0) {
                        $rootScope.user.groupsOpened.push(gID);
                    }
                    $rootScope.user.activeGroup = gID;
                });
            });
        }

        function groupClose(gID) {
            $timeout(function () {
                $rootScope.$apply(function () {
                    const index = $rootScope.user.groupsOpened.indexOf(gID);
                    if (index >= 0) {
                        $rootScope.user.groupsOpened.splice(index, 1);
                    }
                    if(gID === $rootScope.user.activeGroup){
                        if(index >= $rootScope.user.groupsOpened.length){
                            $rootScope.user.activeGroup = $rootScope.user.groupsOpened[index-1];
                        }else{
                            $rootScope.user.activeGroup = $rootScope.user.groupsOpened[index];
                        }
                    }
                });
            });
        }

        function groupSetActive(gID) {
            $rootScope.user.activeGroup = gID;
        }


        //
        // function groupSettings(gID,ev) {
        //     $rootScope.group = {
        //         id      : gID,
        //         curName : $rootScope.user.groupsData[gID].name,
        //         newName : undefined
        //     };
        //
        //     $mdDialog.show({
        //         controller          :   groupSettingsController,
        //         templateUrl         :   './app/components/dashboard/templates/groupSettings.tpl.html',
        //         parent              :   angular.element(document.body),
        //         targetEvent         :   ev,
        //         clickOutsideToClose :   true,
        //         fullscreen          :   false
        //     }).then(function (answer) {
        //         //todo na bgazei pop up gia epibebaiwsi
        //         if(answer === 'delete'){
        //             socketService.deleteGroup(gID);
        //             httpService.groupDelete(gID)
        //                 .then(function (response) {
        //                     if(response.success){
        //                         removeGroup(gID);
        //                         delete $rootScope.user.groupsData[gID];
        //                     }else{
        //                         $location.path('/login');
        //                     }
        //                     delete $rootScope.group;
        //                 });
        //         }else{
        //             if($rootScope.group.curName !== $rootScope.group.newName || $rootScope.group.newName.length > 0){
        //                 httpService.groupUpdateName({gID : gID, gName : $rootScope.group.newName})
        //                     .then(function (response) {
        //                         if(response.success){
        //                             $rootScope.user.groupsData[gID].name = $rootScope.group.newName;
        //                         }else{
        //                             $location.path('/login');
        //                         }
        //                         delete $rootScope.group;
        //                     });
        //             }else{
        //                 delete $rootScope.group;
        //             }
        //         }
        //     },function () {
        //         delete $rootScope.group;
        //     });
        // }

        // function groupSettingsController($scope, $mdDialog) {
        //     $scope.group = $rootScope.group;
        //
        //     $scope.cancelChanges = cancelChanges;
        //     $scope.applyChanges  = applyChanges;
        //     $scope.deleteGroup   = deleteGroup;
        //
        //
        //     function cancelChanges() {
        //         $mdDialog.cancel();
        //     }
        //
        //     function applyChanges() {
        //         $rootScope.group.newName = $scope.group.newName;
        //         $mdDialog.hide('changes');
        //     }
        //
        //     function deleteGroup() {
        //         $mdDialog.hide('delete');
        //     }
        // }

        function removeGroup(gID){
            const index = $rootScope.user.groupsList.indexOf(gID);
            if (index >= 0) {
                $rootScope.user.groupsList.splice(index, 1);
            }
        }

        function groupExists(gID) {
            const index = $rootScope.user.groupsList.indexOf(gID);
            return index !== -1;
        }
    }
})();