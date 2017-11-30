(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('dashboardService', dashboardService);

    dashboardService.$inject = ['$rootScope', '$location', 'httpService', 'socketService', '$timeout'];
    function dashboardService($rootScope, $location, httpService, socketService, $timeout) {
        const service = {};

        service.getAccountGroups = getAccountGroups;

        return service;

        function getAccountGroups() {

            for(let i = 0; i<$rootScope.user.groupsList.length; ++i){
                const gID  = $rootScope.user.groupsList[i];
                if($rootScope.user.groupsData[gID] === undefined){
                    $rootScope.user.groupsData[gID] = { };
                    getGroup(gID);
                }else{
                    const data = $rootScope.user.groupsData[gID].data;
                    if (data === undefined || data === null || data.length === 0){
                        getGroup(gID);
                    }
                }
            }
        }

        function getGroup(id) {
            $rootScope.user.groupsData[id].dataLoading = true;
            httpService.groupRetrieveData(id)
                .then(function (response) {
                    if(response.success){
                        $rootScope.user.groupsData[response.data.id].id = response.data.id;
                        $rootScope.user.groupsData[response.data.id].name = response.data.name;
                        $rootScope.user.groupsData[response.data.id].data = response.data.value;
                        prepareGroup(response.data.id);
                        $rootScope.user.groupsData[response.data.id].dataLoading = false;
                    }else{
                        $location.path('/login');
                    }
                });
        }

        function prepareGroup(id){

            configureAllDates(id);

            //INIT upload fields
            $rootScope.user.groupsData[id].upload = {
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
                        if($rootScope.user.groupsData[id] !== undefined){
                            $rootScope.user.groupsData[id].data[$rootScope.user.groupsData[id].data.length] = data;
                        }
                    });
                });
            });

            //on listen change the group name
            socketService.on(convertGroupID(id, '-'), function (newName) {
               $timeout(function () {
                 $rootScope.$apply(function () {
                   $rootScope.user.groupsData[id].name = newName;
                 });
               });
            });
        }

        function configureAllDates(index) {
            const now = new Date();
            for(let i = 0; i<$rootScope.user.groupsData[index].data.length; ++i){
                const date = new Date($rootScope.user.groupsData[index].data[i].time);
                $rootScope.user.groupsData[index].data[i].date = configureDate(now,date);
            }
        }

        function configureDate(now,date) {
            let dateAsString = 'Today';
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

        function convertGroupID(id, to){
            let retID;
            if(to === '-'){
                retID = id.replace(/_/g, '-');
            }else{
                retID = id.replace(/-/g, '_');
            }
            return retID;
        }
    }
})();