(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('homeService', homeService);

    homeService.$inject = ['$rootScope', '$location', 'httpService', '$timeout'];
    function homeService($rootScope, $location, httpService, $timeout) {
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
                            $location.path('/login');
                        }
                    });
            }
        }
    }
})();