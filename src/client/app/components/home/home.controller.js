(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$rootScope', '$location', 'httpService','homeService', 'socketService', '$timeout'];
    function HomeController($rootScope, $location, httpService, homeService, socketService, $timeout) {
        const vm = this;

        vm.uploadData       = uploadData;
        vm.groupCreate      = groupCreate;
        // vm.groupSettings    = groupSettings;

        (function initController() {
            socketService.connect();
            $rootScope.dataLoading = true;
            if($rootScope.user === undefined || $rootScope.user ===null){
                httpService.accountGetUserInfo(undefined)
                    .then(function (response) {
                        $rootScope.dataLoading = false;
                        if(response.success){
                            $rootScope.user = response.data;
                            homeService.getAccountGroups();
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
                                            homeService.getAccountGroups();
                                        }
                                    }
                                });
                            });
                        });


                    });
            }else{
                $rootScope.dataLoading = false;
                homeService.getAccountGroups();
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
                                homeService.getAccountGroups();
                            }
                            vm.group.creating = false;
                            vm.group.name = '';
                        }
                    });
            }
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