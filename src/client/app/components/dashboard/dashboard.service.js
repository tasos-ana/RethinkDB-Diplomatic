(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('dashboardService', dashboardService);

    dashboardService.$inject = ['$rootScope', '$location', 'socketService', '$timeout'];
    function dashboardService($rootScope, $location, socketService, $timeout) {
        var service = {};

        service.getAccountGroups = getAccountGroups;

        return service;

        function getAccountGroups() {
            for(const id in $rootScope.user.groups){
                const data = $rootScope.user.groups[id].data;
                if(data === undefined || data === null || data.length === 0){
                    getGroup(id);
                }
            }
        }

        function getGroup(id) {
            $rootScope.user.groups[id].dataLoading = true;
            httpService.groupRetrieveData(id)
                .then(function (response) {
                    if(response.success){
                        $rootScope.user.groups[response.data.id].data = response.data.value;
                        prepareGroup(response.data.id);
                        $rootScope.user.groups[response.data.id].dataLoading = false;
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
            const now = new Date();
            for(var i = 0; i<$rootScope.user.groups[index].data.length; ++i){
                const date = new Date($rootScope.user.groups[index].data[i].time);
                $rootScope.user.groups[index].data[i].date = configureDate(now,date);
            }
        }

        function configureDate(now,date) {
            var dateAsString = 'Today';
            const _dd = now.getDate(),
                _mm = now.getMonth() + 1,
                _yyyy = now.getYear();
            const dd = date.getDate(),
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