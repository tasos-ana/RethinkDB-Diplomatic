(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'httpService','dashboardService', 'homeService', 'socketService', '$timeout'];
    function DashboardController($rootScope, $location, httpService, dashboardService, homeService, socketService, $timeout) {
        const vm = this;

        vm.uploadData       = uploadData;
        vm.groupCreate      = groupCreate;
        // vm.groupSettings    = groupSettings;
        vm.groupOpen        = groupOpen;
        vm.groupClose       = groupClose;
        vm.groupSetActive   = groupSetActive;

        (function initController() {
            socketService.connect();
            vm.createGroupFadeIn = false;
            vm.sidebarToggled = false;
            vm.templateURL = $location.path();
            vm.myGroupsExpand = false;
            if($rootScope.user === undefined || $rootScope.user ===null){
                homeService.retrieveAccountDetails(dashboardService.retrieveGroupsData);
            }else{
                dashboardService.retrieveGroupsData();
            }
        })();

        function uploadData(group) {
            group.upload.uploadData = true;

            if(group.upload.data.length>0){
                group.upload.gID = group.id;
                group.upload.type = 'text';
                group.upload.time = Date.now();

                httpService.groupAddData(group.upload)
                    .then(function (response) {
                        if(response.success){
                            group.upload = {
                                data    : '',
                                type    : '',
                                time    : '',
                                table   : ''
                            };
                            group.upload.uploadData = false;
                        } else{
                            $location.path('/login');
                        }
                    });
            }else{
                group.upload.uploadData = false;
            }
        }

        function groupCreate(isValid) {
            if(isValid){
                vm.group.creating = true;
                httpService.groupCreate(vm.group.name)
                    .then(function (response) {
                        if(response.success){
                            if(!groupExists(response.data.gID)){
                                $rootScope.user.groupsList.push(response.data.gID);;
                                groupOpen(response.data.gID);
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
                    const index = $rootScope.user.openedGroupsList.indexOf(gID);
                    if (index < 0) {
                        httpService.groupInsertToOpenedList(gID)
                            .then(function (response) {
                                if(response.success){
                                    $rootScope.user.openedGroupsList.push(gID);
                                    dashboardService.retrieveSingleGroupData(gID);
                                } else{
                                    $location.path('/login');
                                }
                            });
                    }
                    $rootScope.user.activeGroup = gID;
                });
            });
        }

        function groupClose(gID) {
            $timeout(function () {
                $rootScope.$apply(function () {
                    httpService.groupRemoveFromOpenedList(gID)
                        .then(function (response) {
                            if(response.success){
                                const index = $rootScope.user.openedGroupsList.indexOf(gID);
                                if (index >= 0) {
                                    $rootScope.user.openedGroupsList.splice(index, 1);
                                }
                                if(gID === $rootScope.user.activeGroup){
                                    if(index >= $rootScope.user.openedGroupsList.length){
                                        $rootScope.user.activeGroup = $rootScope.user.openedGroupsList[index-1];
                                    }else{
                                        $rootScope.user.activeGroup = $rootScope.user.openedGroupsList[index];
                                    }
                                }
                            } else{
                                $location.path('/login');
                            }
                        });
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
        //         curName : $rootScope.user.openedGroupsData[gID].name,
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
        //                         delete $rootScope.user.openedGroupsData[gID];
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
        //                             $rootScope.user.openedGroupsData[gID].name = $rootScope.group.newName;
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