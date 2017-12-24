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
        vm.groupOpen        = groupOpen;
        vm.groupClose       = groupClose;
        vm.groupSetActive   = groupSetActive;

        (function initController() {
            socketService.connect();
            vm.createGroupFadeIn = false;
            vm.sidebarToggled = false;
            vm.templateURL = $location.path();
            vm.myGroupsExpand = false;
            $rootScope.alert = {};
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
                $timeout(function () {
                    $rootScope.$apply(function () {
                        vm.group.creating = true;
                        httpService.groupCreate(vm.group.name)
                            .then(function (response) {
                                if(response.success){
                                    if(!groupExists(response.data.gID)){
                                        $rootScope.user.groupsList.push(response.data.gID);
                                        $rootScope.user.groupsNames[response.data.gID] = vm.group.name;
                                        groupOpen(response.data.gID);
                                    }
                                    $rootScope.alert.msg = 'New group added with name ';
                                    $rootScope.alert.name = vm.group.name;
                                    $rootScope.alert.enabled = true;
                                    $timeout(function () {
                                        $rootScope.alert.enabled = false;
                                    },5000);
                                    vm.group.creating = false;
                                    vm.group.name = '';
                                }
                            });
                    });
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


        function groupExists(gID) {
            const index = $rootScope.user.groupsList.indexOf(gID);
            return index !== -1;
        }
    }
})();