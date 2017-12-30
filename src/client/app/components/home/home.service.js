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
                            $rootScope.user.activeGroup = undefined;
                            if($rootScope.user.notifications === undefined){
                                $rootScope.user.notifications = {};
                            }
                            _calculateTotalNotifications();

                            cb();
                        }else{
                            $rootScope.loginCauseError.enabled = true;
                            $rootScope.loginCauseError.msg = response.msg;
                            $location.path('/login');
                        }
                    });
            }
        }
        
        function _calculateTotalNotifications() {
            let total = 0;
            for(const id in $rootScope.user.notifications){
                if(id !== 'total'){
                    total+= $rootScope.user.notifications[id];
                }
            }
            $rootScope.user.notifications.total = total;
        }
    }
})();