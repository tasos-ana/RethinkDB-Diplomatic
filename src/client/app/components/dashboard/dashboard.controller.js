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

        function initController() {
            vm.user = $rootScope.user;
            if(vm.user === undefined){
                vm.user = $rootScope.globals.currentUser;
            }
            dashboardService.userByEmail(vm.user.email)
                .then(function (response) {
                if (response.success) {
                    vm.user = response.data;
                    vm.user.groupsID[0].table = vm.user.groupsID[0].prefix1 + vm.user.groupsID[0].prefix2 + vm.user.groupsID[0].prefix3 + vm.user.groupsID[0].prefix4 + vm.user.groupsID[0].prefix5;
                    getData();
                } else {
                    $location.path('/login');
                }
            });
        }
        
        function uploadData() {
            vm.pushing.type = 'text';
            vm.pushing.table = vm.user.groupsID[0].table;
            vm.pushing.time = Date.now();
            dashboardService.pushData(vm.pushing).then(function (response) {
               if(response.success){
                    vm.pushing = {};
               } else{
                   vm.user = null;
                   $location.path('/login');
               }
            });
        }
        
        function getData() {
            dashboardService.getData(vm.user.groupsID[0].table).then(function (response) {
               if(response.success){
                    vm.retrievedData = response.data;
                   configureDate();
               }else{
                   console.log('cant retrieve data from table: ' + vm.user.groupsID[0].table);
               }
            });
        }

        function configureDate() {
            for(var i = 0; i<vm.retrievedData.length; ++i){
                var date = new Date(vm.retrievedData[i].time);
                var dateAsString = 'Today';
                var now = new Date();
                var _dd = now.getDate(),
                    _mm = now.getMonth() + 1,
                    _yyyy = now.getYear();
                var dd = date.getDate(),
                    mm = date.getMonth() + 1,
                    yyyy = date.getYear();

                if( (yyyy !== _yyyy) || (mm !== _mm) || ((dd - _dd)>1) ){
                    dateAsString = dd + '/' + mm + '/' + yyyy;
                }else{
                    if(dd !== _dd){
                        dateAsString = 'Yesterday';
                    }
                }

                vm.retrievedData[i].date = dateAsString + " @ "
                    + date.getHours() + ":"
                    + date.getMinutes() + ":"
                    + date.getSeconds();
            }
        }
    }
})();