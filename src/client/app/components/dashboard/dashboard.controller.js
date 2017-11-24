(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$rootScope', '$location', 'httpService','socketService','$timeout'];
    function DashboardController($rootScope, $location, httpService, socketService, $timeout) {
        var vm = this;

        initController();

        vm.uploadData = uploadData;
        vm.createGroup = createGroup;

        function initController() {
            $rootScope.dataLoading = true;
            if($rootScope.user === undefined || $rootScope.user ===null){
                httpService.accountGetUserByEmail($rootScope.globals.currentUser.email)
                    .then(function (response) {
                        if(response.success){
                            $rootScope.user = response.data;
                            getTables();
                        }else{
                            $location.path('/login');
                        }
                        $rootScope.dataLoading = false;
                    });
            }else{
                getTables();
                $rootScope.dataLoading = false;
            }
        }

        //todo na valw loading gia kathe group
        function getTables() {
            for(var id in $rootScope.user.groups){
                getTable(id);
            }
        }

        function getTable(index) {
            httpService.groupRetrieveData(index)
                .then(function (response) {
                    if(response.success){
                       $rootScope.user.groups[response.data.id].data = response.data.value;
                       prepareGroup(response.data.id);
                    }else{
                       $location.path('/login');
                    }
            });
        }

        function prepareGroup(id){
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
            $rootScope.user.groups[index].upload.uploadData = true;
            if($rootScope.user.groups[index].upload.data.length>0){
                $rootScope.user.groups[index].upload.table = $rootScope.user.groups[index].id;
                $rootScope.user.groups[index].upload.type = 'text';
                $rootScope.user.groups[index].upload.time = Date.now();
                httpService.groupAddData($rootScope.user.groups[index].upload).then(function (response) {
                    if(response.success){
                        $rootScope.user.groups[index].upload = {
                            data    : '',
                            type    : '',
                            time    : '',
                            table   : ''
                        };
                        $rootScope.user.groups[index].upload.uploadData = false;
                    } else{
                        $location.path('/login');
                    }
                });
            }else{
                $rootScope.user.groups[index].upload.uploadData = false;
            }
        }

        //TODO na kanw clear ta fields
        function createGroup() {
            var curUser = $rootScope.globals.currentUser;
            if(curUser === undefined){
                $location.path('/login'); //if user dont have cookie then he must login again
            }
            httpService.groupCreate({uEmail : curUser.email, gName : vm.newGroupName})
                .then(function (response) {
                    if(response.success){
                        $rootScope.user.groups[response.data.id] = response.data;
                        prepareGroup($rootScope.user.groups[response.data.id].id);
                    }
                });
        }
    }
})();