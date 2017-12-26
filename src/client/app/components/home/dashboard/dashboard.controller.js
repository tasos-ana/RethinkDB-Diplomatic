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
            socketService.connectSocket();

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

            socketService.onAccountNameChange(function (newNickname) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if($rootScope.user.nickname !== newNickname){
                            $rootScope.user.nickname = newNickname;
                            notify({ message:"Your nickname change to '" + newNickname +"' from another device.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onAccountPasswordChange(function (newPassword) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if($rootScope.user.password !== newPassword){
                            $rootScope.user.password = newPassword;
                            $rootScope.loginCauseSuccess.title      = ' Password change ';
                            $rootScope.loginCauseSuccess.msg        = ' from another device. Please login again!';
                            $rootScope.loginCauseSuccess.enabled    = true;
                            $location.path('/login');
                        }
                    });
                });
            });

            socketService.onGroupCreate(function (gID, gName) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(gID);
                        if(index === -1){
                            $rootScope.user.groupsList.push(gID);
                            $rootScope.user.groupsNames[gID] = gName;
                            notify({ message:"New group created with name '" + gName +"'.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onGroupDelete(function (gID) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(gID);
                        if(index >= -1){
                            $rootScope.user.groupsList.splice(index, 1);
                            delete $rootScope.user.groupsNames[gID];
                            notify({ message:"The group with name '" + gName +"' deleted.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onGroupNameChange(function (gID, gName) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(gID);
                        const prevName = $rootScope.user.groupsNames[gID];
                        if(index === -1 && prevName!==gName){
                            $rootScope.user.groupsList.push(gID);
                            $rootScope.user.groupsNames[gID] = gName;
                            notify({ message:"Group name change from '" + gName +"' to '" + prevName +"'.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onGroupDataBadge(function () {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        //todo
                    });
                });
            });


            socketService.onGroupDataChange(function (gID, data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        data.date = dashboardService.configureDate(new Date(), new Date(data.time));
                        if($rootScope.user.openedGroupsData[gID] !== undefined){
                            $rootScope.user.openedGroupsData[gID].data[$rootScope.user.openedGroupsData[gID].data.length] = data;
                        }
                    });
                });
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