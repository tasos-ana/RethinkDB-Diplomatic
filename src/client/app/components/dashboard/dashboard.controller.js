(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$scope', '$location', 'dashboardService','socketService'];
    function DashboardController($rootScope,$scope, $location, dashboardService, socketService) {
        var vm = this;

        initController();

        vm.uploadData = uploadData;
        vm.createGroup = createGroup;

        function initController() {
            $rootScope.dataLoading = true;
            dashboardService.userByEmail($rootScope.globals.currentUser.email)
                .then(function (response) {
                    if(response.success){
                        $rootScope.user = response.data;
                        if($rootScope.user.groups.length>0){
                            getAllData();
                        }else{
                            $rootScope.dataLoading = false;
                        }
                    }else{
                        $location.path('/login');
                    }
                });
        }

        function uploadData(index) {
            if($rootScope.user.groups[index].upload.data.length>0){
                $rootScope.user.groups[index].upload.table = $rootScope.user.groups[index].id;
                $rootScope.user.groups[index].upload.type = 'text';
                $rootScope.user.groups[index].upload.time = Date.now();
                dashboardService.pushData($rootScope.user.groups[index].upload).then(function (response) {
                    if(response.success){
                        $rootScope.user.groups[index].upload = {
                            data    : '',
                            type    : '',
                            time    : '',
                            table   : ''
                        };
                    } else{
                        $location.path('/login');
                    }
                });
            }
        }

        function createGroup() {
            var curUser = $rootScope.globals.currentUser;
            if(curUser === undefined){
                $location.path('/login'); //if user dont have cookie then he must login again
            }
            dashboardService.createGroup({user : curUser.email, group : vm.newGroupName})
                .then(function (response) {
                    if(response.success){
                        response.data.upload = {
                            data    : '',
                            type    : '',
                            time    : '',
                            table   : ''
                        };
                        $rootScope.user.groups[$rootScope.user.groups.length] = response.data;
                    }else{
                        $location.path('/login');
                    }
                });
        }


        function getAllData() {
            for (var index = 0; index< $rootScope.user.groups.length; ++index){
                dashboardService.getData($rootScope.user.groups[index].id,index).then(function (response) {
                    var index = 0;
                    if(response.success){
                        $rootScope.user.groups[index].data = response.data;
                        $rootScope.user.groups[index].upload = {
                            data    : '',
                            type    : '',
                            time    : '',
                            table   : ''
                        };
                        configureAllDates(index);
                    }else{
                        $rootScope.user.groups[index] += { data : undefined };
                        console.log('cant retrieve data from table: ' + $rootScope.user.groups[index].id);
                    }
                    if(index === ($rootScope.user.groups.length-1)){
                        $rootScope.dataLoading = false;
                    }
                });
            }
        }


        function configureAllDates(index) {
            var now = new Date();
            for(var i = 0; i<$rootScope.user.groups[index].data.length; ++i){
                var date = new Date($rootScope.user.groups[index].data[i].time);
                $rootScope.user.groups[index].data[i].date = configureDate(now,date);
            }
        }

        function configureDate(now,date) {
            var dateAsString = 'Today';
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

            dateAsString += " @ " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

            return dateAsString;
        }
    }
})();