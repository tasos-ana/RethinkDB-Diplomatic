(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'dashboardService','socketService','$timeout'];
    function DashboardController($rootScope, $location, dashboardService, socketService, $timeout) {
        var vm = this;

        initController();

        vm.uploadData = uploadData;
        vm.createGroup = createGroup;

        function initController() {
            $rootScope.dataLoading = true;
            if($rootScope.user === undefined || $rootScope.user ===null){
                dashboardService.userByEmail($rootScope.globals.currentUser.email)
                    .then(function (response) {
                        if(response.success){
                            console.log(response);
                            $rootScope.user = response.data;
                            prepareGroups();
                        }else{
                            $location.path('/login');
                        }
                        $rootScope.dataLoading = false;
                    });
            }else{
                prepareGroups();
                $rootScope.dataLoading = false;
            }
        }
        
        
        function prepareGroups() {
            for(var id in $rootScope.user.groups){

                configureAllDates(id);

                //INIT upload fields
                $rootScope.user.groups[id].upload = {
                    data    : '',
                    type    : '',
                    time    : '',
                    table   : ''
                };

                //send emit on server
                socketService.emit(id);

                //on listen add the new data
                socketService.on(id, function (data) {
                    $timeout(function () {
                        $rootScope.$apply(function () {
                            data.date = configureDate(new Date(), new Date(data.time));
                            $rootScope.user.groups[id].data[$rootScope.user.groups[id].data.length] = data;
                        });
                    });
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
                        const i = $rootScope.user.groups.length;
                        $rootScope.user.groups[i] = response.data;

                        socketService.emit($rootScope.user.groups[i].id);
                        console.log($rootScope.user.groups[i]);
                        socketService.on($rootScope.user.groups[i].id, function (data) {
                            $timeout(function () {
                                $rootScope.$apply(function () {
                                    data.date = configureDate(new Date(), new Date(data.time));
                                    $rootScope.user.groups[i].data[$rootScope.user.groups[i].data.length] = data;
                                });
                            });

                        });

                    }else{
                        $location.path('/login');
                    }
                });
        }

        // //TODO remove
        // function getAllData() {
        //     $rootScope.user.allGroups = [];
        //     for (var index = 0; index< $rootScope.user.groups.length; ++index){
        //         var id = $rootScope.user.groups[index].id;
        //         $rootScope.user.allGroups[id] = index;
        //         dashboardService.getData($rootScope.user.groups[index].id).then(function (response) {
        //             const i = $rootScope.user.allGroups[response.data.id];
        //             if(response.success){
        //                 $rootScope.user.groups[i].data = response.data.value;
        //                 $rootScope.user.groups[i].upload = {
        //                     data    : '',
        //                     type    : '',
        //                     time    : '',
        //                     table   : ''
        //                 };
        //                 configureAllDates(i);
        //
        //                 socketService.emit($rootScope.user.groups[i].id);
        //
        //                 socketService.on($rootScope.user.groups[i].id, function (data) {
        //                     $timeout(function () {
        //                         $rootScope.$apply(function () {
        //                             data.date = configureDate(new Date(), new Date(data.time));
        //                             $rootScope.user.groups[i].data[$rootScope.user.groups[i].data.length] = data;
        //                         });
        //                     });
        //                 });
        //             }else{
        //                 $rootScope.user.groups[i].data = undefined;
        //                 console.log('cant retrieve data from table: ' + $rootScope.user.groups[i].id);
        //             }
        //             if(i === ($rootScope.user.groups.length-1)){
        //                 $rootScope.dataLoading = false;
        //             }
        //         });
        //     }
        // }

    }
})();