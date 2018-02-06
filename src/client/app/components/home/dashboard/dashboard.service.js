(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('dashboardService', dashboardService);

    dashboardService.$inject = ['$rootScope', '$location', 'httpService', '$timeout'];
    function dashboardService($rootScope, $location, httpService, $timeout) {
        const service = {};

        service.retrieveGroupsData          = _retrieveGroupsData;
        service.retrieveSingleGroupData     = _retrieveSingleGroupData;
        service.retrieveMoreGroupData       = _retrieveMoreGroupData;
        service.retrieveSingleGroupName     = _retrieveSingleGroupName;
        service.retrieveParticipateUserInfo = _retrieveParticipateUserInfo;
        service.configureDate               = _configureDate;

        service.groupOpen                   = _groupOpen;
        service.groupSetActive              = _groupSetActive;

        return service;

        function _retrieveGroupsData() {
            for(let i = 0; i<$rootScope.user.openedGroupsList.length; ++i){
                const gID  = $rootScope.user.openedGroupsList[i];
                _retrieveSingleGroupData(gID, Date.now(), 10);
            }
        }

        function _retrieveSingleGroupData(id, afterFrom, limitVal) {
            let retrieveData = false;
            if($rootScope.user.openedGroupsData[id] === undefined){
                $rootScope.user.openedGroupsData[id] = { };
                if($rootScope.user.activeGroup === undefined){
                    $rootScope.user.activeGroup = id;
                }
                retrieveData = true;
            }else{
                const data = $rootScope.user.openedGroupsData[id].data;
                if (data === undefined || data === null || data.length === 0){
                    retrieveData = true;
                }
            }

            if(retrieveData){
                _retrieveMoreGroupData(id,afterFrom,limitVal);
            }
        }

        function _retrieveMoreGroupData(id, afterFrom, limitVal) {
            $rootScope.user.openedGroupsData[id].dataLoading = true;
            httpService.groupRetrieveData(id, afterFrom, Math.floor(limitVal))
                .then(function (response) {
                    if(response.success){
                        $rootScope.user.openedGroupsData[response.data.id].id = response.data.id;
                        $rootScope.user.openedGroupsData[response.data.id].name = response.data.name;
                        let limitVal = 0;
                        response.data.value.reverse();
                        if($rootScope.user.openedGroupsData[response.data.id].data === undefined){
                            $rootScope.user.openedGroupsData[response.data.id].data = [];
                            $rootScope.user.openedGroupsData[response.data.id].data = response.data.value;
                        }else{
                            limitVal = $rootScope.user.openedGroupsData[response.data.id].data.length;
                            limitVal += limitVal/2;
                            $rootScope.user.openedGroupsData[response.data.id].data = response.data.value.concat($rootScope.user.openedGroupsData[response.data.id].data);
                        }
                        limitVal = Math.floor(limitVal);
                        if(response.data.value.length < limitVal){
                            $rootScope.user.openedGroupsData[response.data.id].noMoreData = true;
                        }
                        prepareGroup(response.data.id);
                    }else{
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.message;
                        $location.path('/login');
                    }
                    $rootScope.user.openedGroupsData[response.data.id].dataLoading = false;
                });
        }

        function _retrieveSingleGroupName(id) {
            httpService.groupRetrieveName(id)
                .then(function (response) {
                    if(response.success){
                        $rootScope.user.groupsNames[response.data.id] = response.data.name;
                    }else{
                        $rootScope.loginCauseError.enabled = true;
                        $rootScope.loginCauseError.msg = response.message;
                        $location.path('/login');
                    }
                });
        }

        function prepareGroup(id){

            configureAllDates(id);

            //INIT upload fields
            $rootScope.user.openedGroupsData[id].upload = {
                textData    : '',
                files       : []
            };

        }

        function configureAllDates(index) {
            const now = new Date();
            for(let i = 0; i<$rootScope.user.openedGroupsData[index].data.length; ++i){
                const user = $rootScope.user.openedGroupsData[index].data[i].user;
                _retrieveParticipateUserInfo(user);
                const date = new Date($rootScope.user.openedGroupsData[index].data[i].time);
                $rootScope.user.openedGroupsData[index].data[i].date = _configureDate(now,date);
                if($rootScope.user.openedGroupsData[index].data[i].modify !== undefined){
                    const modify = new Date($rootScope.user.openedGroupsData[index].data[i].modify);
                    $rootScope.user.openedGroupsData[index].data[i].date += ' (Last modified: ' + _configureDate(now,modify) + ')';
                }
            }
        }

        function _retrieveParticipateUserInfo(user) {
            if($rootScope.user.usersDetails[user] === undefined){
                $rootScope.user.usersDetails[user] = {
                    'email'     : user,
                    'nickname'  : undefined,
                    'avatar'    : undefined
                };
                httpService.accountGetParticipateUserInfo(user)
                    .then(function (response) {
                        if(response.success){
                            if($rootScope.user.usersDetails[response.data.email].email === response.data.email) {
                                $rootScope.user.usersDetails[response.data.email].nickname = response.data.nickname;
                                $rootScope.user.usersDetails[response.data.email].avatar = response.data.avatar;
                            }else{
                                console.log('Error at configureAllDates, while retrieving user details');
                            }
                        }else{
                            console.log('Error at configureAllDates, user do not exists');
                        }
                    });
            }
        }

        function _configureDate(now,date) {
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

        function _groupOpen(gID) {
            $timeout(function () {
                $rootScope.$apply(function () {
                    const index = $rootScope.user.openedGroupsList.indexOf(gID);
                    if (index === -1) {
                        httpService.groupInsertToOpenedList(gID)
                            .then(function (response) {
                                if(response.success){
                                    $rootScope.user.openedGroupsList.push(response.data.gID);
                                    _retrieveSingleGroupData(response.data.gID, Date.now(), 10);
                                    _groupSetActive(response.data.gID);
                                } else{
                                    $rootScope.loginCauseError.enabled = true;
                                    $rootScope.loginCauseError.msg = response.message;
                                    $location.path('/login');
                                }
                            });
                    }
                });
            });
        }

        function _groupSetActive(gID) {
            $rootScope.user.activeGroup = gID;

            if($rootScope.user.groupsList.indexOf(gID) !== -1){
                $rootScope.user.unreadMessages.groups -= $rootScope.user.unreadMessages[gID];
            }else{
                $rootScope.user.unreadMessages.participate -= $rootScope.user.unreadMessages[gID];
            }

            $timeout(function () {
                if($location.path() === '/home/dashboard'){
                    $rootScope.user.unreadMessages[gID] = 0;
                }
            },4000);
        }
    }
})();