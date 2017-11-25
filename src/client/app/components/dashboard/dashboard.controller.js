(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'httpService','dashboardService'];
    function DashboardController($rootScope, $location, httpService, dashboardService) {
        const vm = this;

        vm.uploadData = uploadData;
        vm.groupCreate = groupCreate;

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
            $rootScope.user.groups[gID].upload.uploadData = true;

            if($rootScope.user.groups[gID].upload.data.length>0){

                $rootScope.user.groups[gID].upload.table = $rootScope.user.groups[gID].id;
                $rootScope.user.groups[gID].upload.type = 'text';
                $rootScope.user.groups[gID].upload.time = Date.now();

                httpService.groupAddData($rootScope.user.groups[gID].upload)
                    .then(function (response) {
                        if(response.success){
                            $rootScope.user.groups[gID].upload = {
                                data    : '',
                                type    : '',
                                time    : '',
                                table   : ''
                            };
                            $rootScope.user.groups[gID].upload.uploadData = false;
                        } else{
                            $location.path('/login');
                        }
                });
            }else{
                $rootScope.user.groups[gID].upload.uploadData = false;
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
                        $rootScope.user.groups[response.data.id] = response.data;
                        dashboardService.getAccountGroups();
                        vm.group.creating = false;
                        vm.group.name = '';
                    }
                });
        }

    }
})();