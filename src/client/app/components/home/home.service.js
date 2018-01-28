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
                            }
                            _calculateTotalNotifications();

                            cb();
                        }else{
                            $rootScope.loginCauseError.enabled = true;
                            $rootScope.loginCauseError.msg = response.message;
                            $location.path('/login');
                        }
                    });
            }
        }
        
        function _calculateTotalNotifications() {
            let total = 0;
            for(const id in $rootScope.user.unreadMessages){
                if(id !== 'total'){
                    total+= $rootScope.user.unreadMessages[id];
                }
            }
            $rootScope.user.unreadMessages.total = total;
        }
    }
})();