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
                            cb();
                        }else{
                            $rootScope.loginCauseError.enabled = true;
                            $rootScope.loginCauseError.msg = response.msg;
                            $location.path('/login');
                        }
                    });
            }
        }
    }
})();