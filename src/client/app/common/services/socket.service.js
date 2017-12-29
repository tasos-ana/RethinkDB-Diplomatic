(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('socketService', socketService);

    socketService.$inject = ['$rootScope', '$timeout', 'ngNotify', 'dashboardService', '$location'];
    function socketService($rootScope, $timeout, ngNotify, dashboardService, $location) {
        let socket = null;

        return {
            connectSocket           : _connectSocket,
            disconnectSocket        : _disconnectSocket,

            emitOpenGroup           : _emitOpenGroup,
            emitCloseGroup          : _emitCloseGroup,
            emitDeleteGroup         : _emitDeleteGroup,

            onGroupNameChange       : _onGroupNameChange,
            onGroupDataChange       : _onGroupDataChange,
            onGroupDataBadge        : _onGroupDataBadge,
            onGroupCreate           : _onGroupCreate,
            onGroupDelete           : _onGroupDelete,

            onAccountNameChange     : _onAccountNameChange,
            onAccountPasswordChange : _onAccountPasswordChange
        };

        function _connectSocket() {
            socket = io();
        }

        function _disconnectSocket() {
            if(socket !== null){
                socket.emit('logout');
            }
        }

        function _emitOpenGroup(gID) {
            socketValidate();
            socket.emit('openGroup', gID);
        }

        function _emitCloseGroup(gID) {
            socketValidate();
            socket.emit('closeGroup', gID);
        }

        function _emitDeleteGroup(gID) {
            socketValidate();
            socket.emit('deleteGroup', gID);
        }

        function _onGroupNameChange() {
            socketValidate();
            /**
             * Data contains {gName, gID}
             */
            socket.on('groupNameChange', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        const index = $rootScope.user.groupsList.indexOf(data.gID);
                        const prevName = $rootScope.user.groupsNames[data.gID];
                        if(index !== -1 && prevName!==data.gName){
                            $rootScope.user.groupsNames[data.gID] = data.gName;
                            ngNotify.dismiss();
                            ngNotify.set("Group name change from '" + prevName +"' to '" + data.gName  +"'.", "notice-success");
                        }
                    });
                });
            });
        }

        function _onGroupDataChange() {
            socketValidate();
            /**
             * Data contains {gID , value:{data,time,date,type}}
             */
            socket.on('groupDataChange', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        data.value.date = dashboardService.configureDate(new Date(), new Date(data.value.time));
                        if($rootScope.user.openedGroupsData[data.gID] !== undefined){
                            $rootScope.user.openedGroupsData[data.gID].data[$rootScope.user.openedGroupsData[data.gID].data.length] = data.value;
                        }
                    });
                });
            });
        }

        function _onGroupDataBadge() {
            socketValidate();
            /**
             * data contains gID
             */
            socket.on('groupDataBadge', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if($rootScope.user.activeGroup !== data.gID) {
                            if ($rootScope.user.notifications[data.gID] === undefined) {
                                $rootScope.user.notifications[data.gID] = 1;
                            } else {
                                $rootScope.user.notifications[data.gID] += 1;
                            }
                            if($rootScope.user.notifications.total !== undefined){
                                $rootScope.user.notifications.total+=1;
                            }else{
                                $rootScope.user.notifications.total = 1;
                            }

                        }
                    });
                });
            });
        }

        function _onGroupCreate() {
            socketValidate();
            /**
             * Data contains {uEmail, id:gID, name:newName}
             */
            socket.on('groupCreate', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if(data.uEmail === $rootScope.user.email){
                            const index = $rootScope.user.groupsList.indexOf(data.gID);
                            if(index === -1){
                                $rootScope.user.groupsList.push(data.gID);
                                $rootScope.user.groupsNames[data.gID] = data.gName;
                                ngNotify.dismiss();
                                ngNotify.set("New group created with name '" + data.gName +"'.", "notice-success");
                            }
                        }
                    });
                });
            });
        }

        function _onGroupDelete() {
            socketValidate();
            /**
             * Data contains {uEmail, gID:gID}
             */
            socket.on('groupDelete', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if(data.uEmail === $rootScope.user.email){
                            const index = $rootScope.user.groupsList.indexOf(data.gID);
                            if(index >= -1){
                                $rootScope.user.groupsList.splice(index, 1);
                                delete $rootScope.user.groupsNames[data.gID];

                                if($location.path() === "/home/dashboard"){
                                    const index = $rootScope.user.openedGroupsList.indexOf(data.gID);
                                    if (index >= 0) {
                                        $rootScope.user.openedGroupsList.splice(index, 1);
                                    }
                                    if(data.gID === $rootScope.user.activeGroup){
                                        if(index >= $rootScope.user.openedGroupsList.length){
                                            $rootScope.user.activeGroup = $rootScope.user.openedGroupsList[index-1];
                                        }else{
                                            $rootScope.user.activeGroup = $rootScope.user.openedGroupsList[index];
                                        }
                                    }
                                }
                                ngNotify.dismiss();
                                ngNotify.set("The group with name '" + data.gName +"' deleted.", "notice-success");
                            }
                        }
                    });
                });
            });
        }

        function _onAccountNameChange() {
            socketValidate();
            /**
             * Data contains {uEmail, nickname:newNickname}
             */
            socket.on('accountNameChange', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if(data.uEmail === $rootScope.user.email){
                            if($rootScope.user.nickname !== data.uNickname){
                                $rootScope.user.nickname = data.uNickname;
                                ngNotify.dismiss();
                                ngNotify.set("Your nickname change to '" + data.uNickname +"' from another device.", "notice-success");
                            }
                        }
                    });
                });
            });
        }

        function _onAccountPasswordChange() {
            socketValidate();
            /**
             * Data contains {password:newPassword}
             */
            socket.on('accountPasswordChange', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if($rootScope.user.password !== data.uPassword){
                            $rootScope.loginCauseSuccess.title      = ' Password change from another device. ';
                            $rootScope.loginCauseSuccess.msg        = 'Please login again!';
                            $rootScope.loginCauseSuccess.enabled    = true;
                            $location.path('/login');
                        }else{
                            $rootScope.user.password = undefined;
                        }
                    });
                });
            });
        }
        
        function socketValidate() {
            if(socket === null){
                _connectSocket();
            }
        }
    }
})();
