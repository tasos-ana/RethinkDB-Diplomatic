(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'httpService','dashboardService', 'homeService', 'socketService', '$timeout', 'notify'];
    function DashboardController($rootScope, $location, httpService, dashboardService, homeService, socketService, $timeout, notify) {
        const vm = this;

        vm.uploadData       = uploadData;
        vm.groupCreate      = groupCreate;
        vm.groupOpen        = groupOpen;
        vm.groupClose       = groupClose;
        vm.groupSetActive   = groupSetActive;

        (function initController() {
            notify.config({duration:'5000', position:'center'});
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

            socketService.onAccountNameChange(function () {
                //todo
            });

            socketService.onAccountPasswordChange(function () {
                //todo
            });

            socketService.onGroupCreate(function () {
                //todo
            });

            socketService.onGroupDelete(function () {
                //todo
            });

            socketService.onGroupNameChange(function () {
                //todo
            });

            socketService.onGroupDataBadge(function () {
                //todo
            });

            socketService.onGroupDataChange(function () {
                //todo
            });
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
                            $rootScope.loginCauseError.enabled = true;
                            $rootScope.loginCauseError.msg = response.msg;
                            $location.path('/login');
                        }
                    });
            }else{
                group.upload.uploadData = false;
            }
        }

        function groupCreate(isValid) {
            if(isValid){
                notify({ message:"Group creating, please wait...", classes :'bg-dark border-info text-info', duration:'3000'});
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
                                    notify({ message:"New group created successfully with name: "+ vm.group.name, classes :'bg-dark border-success text-success'});
                                    vm.group.creating = false;
                                    vm.group.name = '';
                                    vm.createGroupFadeIn=false;
                                }
                            });
                    });
                });
            }
        }

        function groupOpen(gID) {
            socketService.emitOpenGroup(gID);

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
                                    $rootScope.loginCauseError.enabled = true;
                                    $rootScope.loginCauseError.msg = response.msg;
                                    $location.path('/login');
                                }
                            });
                    }
                    $rootScope.user.activeGroup = gID;
                });
            });
        }

        function groupClose(gID) {
            socketService.emitCloseGroup(gID);
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
                                $rootScope.loginCauseError.enabled = true;
                                $rootScope.loginCauseError.msg = response.msg;
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