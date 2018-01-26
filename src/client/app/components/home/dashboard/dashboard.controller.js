(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'httpService','dashboardService',
                                'homeService', 'socketService', '$timeout', 'ngNotify', '$window', 'FileSaver', 'Blob'];
    function DashboardController($rootScope, $location, httpService, dashboardService,
                                 homeService, socketService, $timeout, ngNotify, $window, FileSaver, Blob) {
        const vm = this;

        vm.uploadData           = uploadData;
        vm.clearUploadData      = clearUploadData;
        vm.groupCreate          = groupCreate;
        vm.groupShare           = groupShare;
        vm.openGroupCreateModal = openGroupCreateModal;
        vm.openShareGroupModal  = openShareGroupModal;
        vm.groupOpen            = groupOpen;
        vm.groupClose           = groupClose;
        vm.groupSetActive       = dashboardService.groupSetActive;
        vm.loadMoreData         = loadMoreData;

        vm.openFileLoader       = openFileLoader;
        vm.saveAs               = saveAs;

        vm.deleteMessage        = deleteMessage;
        vm.modifyMessage        = modifyMessage;

        (function initController() {
            vm.dataLoading = true;
            socketService.connectSocket();

            ngNotify.config({
                sticky   : false,
                duration : 5000
            });
            ngNotify.addType('notice-success','bg-success text-dark');
            ngNotify.addType('notice-danger','bg-danger text-light');
            ngNotify.addType('notice-info','bg-info text-dark');

            vm.createGroupFadeIn = false;
            vm.shareGroupFadeIn = false;
            vm.sidebarToggled = false;
            vm.templateURL = $location.path();
            vm.eventListener = {};
            vm.myGroupsExpand = false;
            vm.editButton = {};
            vm.editMessage    = {};
            if($rootScope.user === undefined || $rootScope.user ===null){
                homeService.retrieveAccountDetails(dashboardService.retrieveGroupsData);
            }else{
                dashboardService.retrieveGroupsData();
            }

            socketService.onAccountDetails();
            socketService.onGroupDetails();
            socketService.onGroupData();

            vm.dataLoading = false;
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

        function saveAs(gID, mID) {
            $rootScope.user.openedGroupsData[gID].dataLoading = true;
            httpService.retrieveFileValue(gID, mID)
                .then(function (response) {
                    if(response.success){
                        var dataFile = new Blob([convertDataURIToBinary(response.data.file)], { type: response.data.type + ';charset=utf-8' });
                        FileSaver.saveAs(dataFile, '' + response.data.name);
                    }else{
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.message;
                        $location.path('/login');
                    }
                    $rootScope.user.openedGroupsData[gID].dataLoading = false;
                });
        }

        function deleteMessage(gID, mID) {
            httpService.groupDeleteMessage(gID,mID)
                .then(function (response) {
                    if(!response.success){
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.message;
                        $location.path('/login');
                    }
            });
        }
        
        function modifyMessage(gID, mID) {
            httpService.groupModifyMessage(gID,mID, vm.editMessage.value)
                .then(function (response) {
                    if(!response.success){
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.message;
                        $location.path('/login');
                    }
                });
        }

        function handleFileSelect(evt, gID) {
            const files = evt.target.files;
            // files is a FileList of File objects. List some properties.
            $rootScope.user.openedGroupsData[gID].upload.files = [];
            $timeout(function () {
                $rootScope.$apply(function () {
                    for (let i = 0, f; f = files[i]; i++) {
                        let file = {
                            name : escape(f.name),
                        };
                        if(f.size >= 1000000){
                            file.size = parseFloat(Number(f.size/1000000));
                            file.type = ' mb';
                        }else{
                            file.size = parseFloat(Number(f.size/1000));
                            file.type = ' kb';
                        }
                        $rootScope.user.openedGroupsData[gID].upload.files.push(file);
                    }
                });
            });
        }

        function uploadData(group) {
            group.upload.uploadData = true;
            group.upload.uploadJobs = 0;

            if(group.upload.files.length>0){
                const evt = vm.eventListener[group.id];
                const files = evt.target.files; // FileList object

                for (let i = 0, f; f = files[i]; i++) {
                    const reader = new FileReader();
                    $rootScope.user.openedGroupsData[group.id].dataLoading = true;
                    // Closure to capture the file information.
                    reader.onload = (function(theFile, gID) {
                        return function(e) {
                            group.upload.uploadJobs += 1;
                            httpService.groupAddData({
                                gID     : gID,
                                type    : theFile.type,
                                file    : e.target.result,
                                value   : theFile.name,
                                time    : Date.now(),
                                user    : $rootScope.user.email
                            }).then(function (response) {
                                $rootScope.user.openedGroupsData[response.data.gID].dataLoading = false;
                               if(response.success){
                                   group.upload.uploadJobs -= 1;
                                   uploadText(group);
                               }else{
                                   $rootScope.loginCauseError.enabled = true;
                                   $rootScope.loginCauseError.msg = response.message;
                                   $location.path('/login');
                               }
                                });
                        };
                    })(f, group.id);

                    // Read in the image file as a data URL.
                    reader.readAsDataURL(f);
                }
            }else{
                uploadText(group);
            }
        }

        function uploadText(group) {
            if(group.upload.uploadJobs <= 0){
                if(group.upload.textData.length>0){
                    group.upload.uploadJobs += 1;
                    $rootScope.user.openedGroupsData[group.id].dataLoading = true;
                    httpService.groupAddData({
                        gID     : group.id,
                        type    : 'text',
                        value   : group.upload.textData,
                        time    : Date.now(),
                        user    : $rootScope.user.email
                    }).then(function (response) {
                        $rootScope.user.openedGroupsData[response.data.gID].dataLoading = false;
                        if(response.success){
                            group.upload.uploadJobs -= 1;
                            if(group.upload.uploadJobs <= 0){
                                $timeout(function () {
                                    $rootScope.$apply(function () {
                                        group.upload = {
                                            textData    : '',
                                            files       : [],
                                            uploadData  : false
                                        };
                                    });
                                });
                            }
                        } else{
                            $rootScope.loginCauseError.enabled = true;
                            $rootScope.loginCauseError.msg = response.message;
                            $location.path('/login');
                        }
                    });
                }else{
                    if(group.upload.uploadJobs <= 0) {
                        $timeout(function () {
                            $rootScope.$apply(function () {
                                group.upload = {
                                    textData: '',
                                    files: [],
                                    uploadData: false
                                };
                            });
                        });
                    }
                }
            }
        }
        
        function clearUploadData(gID) {
            $rootScope.user.openedGroupsData[gID].upload = {
                textData    : '',
                files       : [],
                uploadData  : false
            };
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
                                    vm.group.creating = false;
                                    vm.group.name = '';
                                    vm.createGroupFadeIn=false;
                                }
                            });
                    });
                });
            }
        }
        
        function groupShare(isValid) {
            if($rootScope.user.groupsList.length === 0){
                vm.shareGroupFadeIn = false;
            }else{
                if(isValid){
                    if(vm.share.group === undefined){
                        ngNotify.dismiss();
                        ngNotify.set("Please select a group first.", "notice-danger");
                    }else{
                        ngNotify.dismiss();
                        ngNotify.set("Group sharing, please wait...", "notice-info");
                        $timeout(function () {
                            $rootScope.$apply(function () {
                                vm.share.creating = true;
                                httpService.groupShare(vm.share.email, vm.share.group)
                                    .then(function (response) {
                                        if(response.success){
                                            vm.share.creating = false;
                                            delete vm.share.email;
                                            delete vm.share.group;
                                            vm.shareGroupFadeIn=false;
                                        }
                                    });
                            });
                        });
                    }
                }
            }
        }
        
        function openGroupCreateModal() {
            vm.createGroupFadeIn=true;
            $window.document.getElementById('createGroupInput').focus();
        }
        
        function openShareGroupModal() {
            vm.shareGroupFadeIn = true;
        }

        function groupOpen(gID) {
            if ($rootScope.user.openedGroupsList.indexOf(gID) !== -1) {
                dashboardService.groupSetActive(gID);
            } else {
                dashboardService.groupOpen(gID);
            }
            socketService.emitOpenGroup(gID);
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

                                delete $rootScope.user.openedGroupsData[gID];
                                if(gID === $rootScope.user.activeGroup){
                                    if(index >= $rootScope.user.openedGroupsList.length){
                                        $rootScope.user.activeGroup = $rootScope.user.openedGroupsList[index-1];
                                    }else{
                                        $rootScope.user.activeGroup = $rootScope.user.openedGroupsList[index];
                                    }
                                }
                            } else{
                                $rootScope.loginCauseError.enabled = true;
                                $rootScope.loginCauseError.msg = response.message;
                                $location.path('/login');
                            }
                        });
                });
            });
        }
        
        function loadMoreData(gID) {
            let afterFrom, limitVal;
            limitVal = $rootScope.user.openedGroupsData[gID].data.length;
            afterFrom = $rootScope.user.openedGroupsData[gID].data[0].time;

            dashboardService.retrieveMoreGroupData(gID, afterFrom, limitVal+limitVal/2);
        }

        function convertDataURIToBinary(dataURI) {
            const BASE64_MARKER = ';base64,';
            var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
            var base64 = dataURI.substring(base64Index);
            var raw = window.atob(base64);
            var rawLength = raw.length;
            var array = new Uint8Array(new ArrayBuffer(rawLength));

            for(var i = 0; i < rawLength; i++) {
                array[i] = raw.charCodeAt(i);
            }
            return array;
        }
    }
})();