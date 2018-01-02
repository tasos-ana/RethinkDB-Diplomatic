(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'httpService','dashboardService', 'homeService', 'socketService', '$timeout', 'ngNotify', '$window'];
    function DashboardController($rootScope, $location, httpService, dashboardService, homeService, socketService, $timeout, ngNotify, $window) {
        const vm = this;

        vm.uploadData       = uploadData;
        vm.clearUploadData  = clearUploadData;
        vm.groupCreate      = groupCreate;
        vm.openGroupCreate  = openGroupCreate;
        vm.groupOpen        = groupOpen;
        vm.groupClose       = groupClose;
        vm.groupSetActive   = groupSetActive;
        vm.loadMoreData     = loadMoreData;

        vm.openFileLoader   = openFileLoader;

        (function initController() {
            socketService.connectSocket();

            ngNotify.config({
                sticky   : false,
                duration : 5000
            });
            ngNotify.addType('notice-success','bg-success text-dark');
            ngNotify.addType('notice-danger','bg-danger text-light');
            ngNotify.addType('notice-info','bg-info text-dark');

            vm.createGroupFadeIn = false;
            vm.sidebarToggled = false;
            vm.templateURL = $location.path();
            vm.eventListener = {};
            vm.myGroupsExpand = false;
            if($rootScope.user === undefined || $rootScope.user ===null){
                homeService.retrieveAccountDetails(dashboardService.retrieveGroupsData);
            }else{
                dashboardService.retrieveGroupsData();
            }

            socketService.onAccountNameChange();
            socketService.onAccountPasswordChange();

            socketService.onGroupCreate();
            socketService.onGroupDelete();
            socketService.onGroupNameChange();
            socketService.onGroupDataBadge();
            socketService.onGroupDataChange();
        })();

        function openFileLoader(gID) {
            $window.document.getElementById('files').click();

            if(vm.eventListener[gID] === undefined){
                $window.document.getElementById('files').addEventListener('change', function (evt) {
                    vm.eventListener[gID] = evt;
                    handleFileSelect(evt,gID);
                }, false);
            }

        }

        function handleFileSelect(evt, gID) {
            const files = evt.target.files;
            // files is a FileList of File objects. List some properties.
            $rootScope.user.openedGroupsData[gID].upload.files = [];
            $timeout(function () {
                $rootScope.$apply(function () {
                    for (let i = 0, f; f = files[i]; i++) {
                        $rootScope.user.openedGroupsData[gID].upload.files.push({
                            name : escape(f.name),
                            size : parseFloat(Number(f.size/1000000)).toFixed(2)
                        });
                    }
                });
            });
        }

        function uploadData(group) {
            group.upload.uploadData = true;

            if(group.upload.files.length>0){
                const evt = vm.eventListener[group.id];
                const files = evt.target.files; // FileList object

                for (let i = 0, f; f = files[i]; i++) {
                    var reader = new FileReader();

                    // Closure to capture the file information.
                    reader.onload = (function(theFile) {
                        return function(e) {
                            // Render thumbnail.
                            console.log(escape(theFile.name));
                            console.log(e.target.result);
                        };
                    })(f);

                    // Read in the image file as a data URL.
                    reader.readAsBinaryString(f);


                }
            }

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
                                table   : '',
                                files   : []
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
        
        function clearUploadData(gID) {

            $rootScope.user.openedGroupsData[gID].upload.files = [];

            $rootScope.user.openedGroupsData[gID].upload = {
                data    : '',
                type    : '',
                time    : '',
                table   : ''
            };
            $rootScope.user.openedGroupsData[gID].upload.uploadData = false;
        }

        function groupCreate(isValid) {
            if(isValid){
                ngNotify.dismiss();
                ngNotify.set("Group creating, please wait...", "notice-info");
                $timeout(function () {
                    $rootScope.$apply(function () {
                        vm.group.creating = true;
                        httpService.groupCreate(vm.group.name)
                            .then(function (response) {
                                if(response.success){
                                    if(!groupExists(response.data.gID)){
                                        $rootScope.user.groupsList.push(response.data.gID);
                                        $rootScope.user.groupsNames[response.data.gID] = response.data.gName;
                                    }
                                    $rootScope.user.unreadMessages[response.data.gID] = 0;
                                    groupOpen(response.data.gID);
                                    ngNotify.dismiss();
                                    ngNotify.set("New group created successfully with name: " + response.data.gName, "notice-success");
                                    vm.group.creating = false;
                                    vm.group.name = '';
                                    vm.createGroupFadeIn=false;
                                }
                            });
                    });
                });
            }
        }
        
        function openGroupCreate() {
            vm.createGroupFadeIn=true;
            $window.document.getElementById('createGroupInput').focus();
        }

        function groupOpen(gID) {
            socketService.emitOpenGroup(gID);

            $timeout(function () {
                $rootScope.$apply(function () {
                    const index = $rootScope.user.openedGroupsList.indexOf(gID);
                    if (index === -1) {
                        httpService.groupInsertToOpenedList(gID)
                            .then(function (response) {
                                if(response.success){
                                    $rootScope.user.openedGroupsList.push(response.data.gID);
                                    groupSetActive(response.data.gID);
                                    dashboardService.retrieveSingleGroupData(response.data.gID, Date.now(), 10);
                                } else{
                                    $rootScope.loginCauseError.enabled = true;
                                    $rootScope.loginCauseError.msg = response.msg;
                                    $location.path('/login');
                                }
                            });
                    }
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
            if($rootScope.user.unreadMessages[gID] === undefined){
                $rootScope.user.unreadMessages[gID] = 0;
            }
            const prevVal = $rootScope.user.unreadMessages[gID];
            $rootScope.user.unreadMessages.total -= prevVal;
            if(prevVal!==0) {
                httpService.groupUpdateUnreadMessages(gID, 0).then(function () {
                });
            }
            $timeout(function () {
                if($location.path() === '/home/dashboard'){
                    $rootScope.user.unreadMessages[gID] = 0;
                }
            },4000);

        }
        
        function loadMoreData(gID) {
            let afterFrom, limitVal;
            limitVal = $rootScope.user.openedGroupsData[gID].data.length;
            afterFrom = $rootScope.user.openedGroupsData[gID].data[0].time;

            dashboardService.retrieveMoreGroupData(gID, afterFrom, limitVal+limitVal/2);
        }

        function groupExists(gID) {
            const index = $rootScope.user.groupsList.indexOf(gID);
            return index !== -1;
        }
    }
})();