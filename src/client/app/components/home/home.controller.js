(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$rootScope', '$location', 'homeService', 'socketService', 'notify', 'dashboardService'];
    function HomeController($rootScope, $location, homeService, socketService, notify, dashboardService) {
        const vm = this;

        (function initController() {
            notify.config({duration:'4000', position:'center'});
            vm.templateURL = $location.path();
            homeService.retrieveAccountDetails(function () {});


            socketService.onAccountNameChange(function (newNickname) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if($rootScope.user.nickname !== newNickname){
                            $rootScope.user.nickname = newNickname;
                            notify({ message:"Your nickname change to '" + newNickname +"' from another device.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onAccountPasswordChange(function (newPassword) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if($rootScope.user.password !== newPassword){
                            $rootScope.user.password = newPassword;
                            $rootScope.loginCauseSuccess.title      = ' Password change ';
                            $rootScope.loginCauseSuccess.msg        = ' from another device. Please login again!';
                            $rootScope.loginCauseSuccess.enabled    = true;
                            $location.path('/login');
                        }
                    });
                });
            });

            socketService.onGroupCreate(function (gID, gName) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(gID);
                        if(index === -1){
                            $rootScope.user.groupsList.push(gID);
                            $rootScope.user.groupsNames[gID] = gName;
                            notify({ message:"New group created with name '" + gName +"'.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onGroupDelete(function (gID) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(gID);
                        if(index >= -1){
                            $rootScope.user.groupsList.splice(index, 1);
                            delete $rootScope.user.groupsNames[gID];
                            notify({ message:"The group with name '" + gName +"' deleted.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onGroupNameChange(function (gID, gName) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(gID);
                        const prevName = $rootScope.user.groupsNames[gID];
                        if(index === -1 && prevName!==gName){
                            $rootScope.user.groupsList.push(gID);
                            $rootScope.user.groupsNames[gID] = gName;
                            notify({ message:"Group name change from '" + gName +"' to '" + prevName +"'.", classes :'bg-dark border-success text-success'});
                        }
                    });
                });
            });

            socketService.onGroupDataBadge(function () {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        //todo
                    });
                });
            });


        })();
    }
})();