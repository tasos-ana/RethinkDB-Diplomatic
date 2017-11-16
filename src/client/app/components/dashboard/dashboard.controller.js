(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'dashboardService'];
    function DashboardController($rootScope, $location, dashboardService) {
        var vm = this;

        initController();

        vm.uploadData = uploadData;
        vm.getData = getData;

        function initController() {
            vm.user = $rootScope.user;
            if(vm.user === undefined){
                vm.user = $rootScope.globals.currentUser;
            }
            dashboardService.userByEmail(vm.user.email)
                .then(function (response) {
                if (response.success) {
                    vm.user = response.data;
                } else {
                    $location.path('/login');
                }
            });
        }
        
        function uploadData() {
            vm.pushing.type = 'text';
            vm.pushing.table = vm.user.groupsID[0].prefix1 + vm.user.groupsID[0].prefix2 + vm.user.groupsID[0].prefix3 + vm.user.groupsID[0].prefix4 + vm.user.groupsID[0].prefix5;
            dashboardService.pushData(vm.pushing).then(function (response) {
               if(response.success){
                    vm.pushing = null;
               } else{
                   vm.user = null;
                   $location.path('/login');
               }
            });
        }
    }
})();