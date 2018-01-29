(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('homeService', homeService);

    homeService.$inject = ['$rootScope', '$location', 'httpService'];
    function homeService($rootScope, $location, httpService) {
        const service = {};

        service.retrieveAccountDetails = retrieveAccountDetails;

        return service;
        
        function retrieveAccountDetails(cb) {
            if($rootScope.user === undefined || $rootScope.user ===null){
                httpService.accountGetUserInfo(undefined)
                    .then(function (response) {
                        if(response.success){
                            $rootScope.user = response.data;
                            if($rootScope.user.usersDetails === undefined){
                                $rootScope.user.usersDetails = {};
                                $rootScope.user.usersDetails[$rootScope.user.email] = {
                                    'email'     : $rootScope.user.email,
                                    'nickname'  : $rootScope.user.nickname,
                                    'avatar'    : $rootScope.user.avatar
                                };
                                delete $rootScope.user.nickname;
                                delete $rootScope.user.avatar;
                            }

                            $rootScope.user.activeGroup = undefined;
                            if($rootScope.user.unreadMessages === undefined){
                                $rootScope.user.unreadMessages = {};
                                $rootScope.user.unreadMessages['participate'] = 0;
                                $rootScope.user.unreadMessages['groups'] = 0;
                            }
                            new Fingerprint2().get(function(result, components){
                                $rootScope.user.fingerprint = result;
                                _calculateUnreadMessages();
                            });

                            cb();
                        }else{
                            $rootScope.loginCauseError.enabled = true;
                            $rootScope.loginCauseError.msg = response.message;
                            $location.path('/login');
                        }
                    });
            }
        }
        
        function _calculateUnreadMessages() {

            let groups = ($rootScope.user.groupsList).concat($rootScope.user.participateGroupsList);
            while(groups.length>0){
                const gID = groups.pop();
                _retrieveUnreadMessages(gID);
            }
        }

        function _retrieveUnreadMessages(gID) {
            httpService.groupRetrieveTotalUnreadMessages(gID, $rootScope.user.fingerprint)
                .then(function (response) {
                    if(response.success){
                        $rootScope.user.unreadMessages[response.data.gID] = response.data.unreadMessages;
                        if($rootScope.user.groupsList.indexOf(response.data.gID) !== -1){
                            $rootScope.user.unreadMessages.groups +=  response.data.unreadMessages;
                        }else{
                            $rootScope.user.unreadMessages.participate +=  response.data.unreadMessages;
                        }
                    }
                });
        }
    }
})();