/**
 * Angular module that handle event from socket and render it on client
 */
(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('socketService', socketService);

    socketService.$inject = ['$rootScope', '$timeout', 'ngNotify', 'dashboardService', '$location', 'httpService', 'md5'];
    function socketService($rootScope, $timeout, ngNotify, dashboardService, $location, httpService, md5) {
        let socket = null;

        return {
            connectSocket       : _connectSocket,
            disconnectSocket    : _disconnectSocket,

            emitOpenGroup       : _emitOpenGroup,
            emitCloseGroup      : _emitCloseGroup,
            emitDeleteGroup     : _emitDeleteGroup,

            onGroupData         : _onGroupData,
            onGroupDetails      : _onGroupDetails,

            onAccountDetails    : _onAccountDetails,
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

        function _onGroupData() {
            _onGroupDataAdd();
            _onGroupDataRemove();
            _onGroupDataModify();
        }
        
        function _onGroupDetails() {
            _onGroupNameChange();
            // _onGroupDataBadge();
            _onGroupCreate();
            _onGroupDelete();

            _onParticipateAdd();
            _onParticipateRemove();
        }
        
        function _onAccountDetails() {
            _onAccountNameChange();
            _onAccountPasswordChange();
            _onAccountAvatarChange();
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

        function _onGroupDataAdd() {
            socketValidate();
            /**
             * Data contains {gID , value:{data,time,date,type}}
             */
            socket.on('groupDataAdd', function (data) {
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
        
        function _onGroupDataRemove() {
            socketValidate();
            /**
             * Data contains {gID , value:mID}
             */
            socket.on('groupDataRemove', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        tryDeleteMessage(data.gID, data.value);
                    });
                });
            });
        }
        
        function _onGroupDataModify() {
            socketValidate();
            /**
             * Data contains {gID , value:{mID, data, modify}}
             */
            socket.on('groupDataModify', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        tryModifyMessage(data.gID, data.value);
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
                            if ($rootScope.user.unreadMessages[data.gID] === undefined) {
                                $rootScope.user.unreadMessages[data.gID] = 1;
                            } else {
                                $rootScope.user.unreadMessages[data.gID] += 1;
                            }

                            httpService.groupUpdateUnreadMessages(data.gID, $rootScope.user.unreadMessages[data.gID]).then(function () {});
                            if($rootScope.user.unreadMessages.total !== undefined){
                                $rootScope.user.unreadMessages.total+=1;
                            }else{
                                $rootScope.user.unreadMessages.total = 1;
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
                                $rootScope.user.unreadMessages[data.gID] = 0;
                                dashboardService.groupOpen(data.gID);
                                _emitOpenGroup(data.gID);
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

                                $rootScope.user.unreadMessages.total -= $rootScope.user.unreadMessages[data.gID];
                                delete $rootScope.user.unreadMessages[data.gID];

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
        
        function _onParticipateAdd() {
            socketValidate();
            /**
             * Data contains {uEmail, gID, gName}
             */
            socket.on('participateAdd',function (data) {
                $timeout(function () {
                   $rootScope.$apply(function () {
                      if(data.uEmail === $rootScope.user.email){
                          const index = $rootScope.user.participateGroupsList.indexOf(data.gID);
                          if(index === -1){
                              $rootScope.user.participateGroupsList.push(data.gID);
                              $rootScope.user.groupsNames[data.gID] = data.gName;
                              $rootScope.user.unreadMessages[data.gID] = 0;
                              dashboardService.groupOpen(data.gID);
                              _emitOpenGroup(data.gID);
                              ngNotify.dismiss();
                              ngNotify.set("New group shared to you with name '" + data.gName +"'.", "notice-success");
                          }
                      }
                   });
                });
            })
        }
        
        function _onParticipateRemove() {
            socketValidate();
            /**
             * Data contains {uEmail, gID:gID}
             */
            socket.on('participateRemove', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if(data.uEmail === $rootScope.user.email){
                            const index = $rootScope.user.participateGroupsList.indexOf(data.gID);
                            if(index >= -1){
                                $rootScope.user.participateGroupsList.splice(index, 1);
                                delete $rootScope.user.groupsNames[data.gID];

                                $rootScope.user.unreadMessages.total -= $rootScope.user.unreadMessages[data.gID];
                                delete $rootScope.user.unreadMessages[data.gID];

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
                                ngNotify.set("The owner of shared group '" + data.gName +"' removed you.", "notice-success");
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
                            if($rootScope.user.usersDetails[$rootScope.user.email].nickname !== data.uNickname){
                                $rootScope.user.usersDetails[$rootScope.user.email].nickname = data.uNickname;
                                ngNotify.dismiss();
                                ngNotify.set("Your nickname change to '" + data.uNickname +"' successful.", "notice-success");
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
                        if($rootScope.user.password !== data.uPassword && data.uPassword !== md5('')){
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
        
        function _onAccountAvatarChange() {
            socketValidate();
            /**
             * Data contains {avatar:newAvatar}
             */
            socket.on('accountAvatarChange', function (data) {
                $timeout(function () {
                    $rootScope.$apply(function () {
                        if(data.uEmail === $rootScope.user.email){
                            if($rootScope.user.usersDetails[$rootScope.user.email].avatar !== data.avatar){
                                $rootScope.user.usersDetails[$rootScope.user.email].avatar = data.avatar;
                                ngNotify.dismiss();
                                ngNotify.set("Your avatar change successful.", "notice-success");
                            }
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

        function tryDeleteMessage(gID, mID) {
            for(let i=0; i<$rootScope.user.openedGroupsData[gID].data.length; ++i){
                if($rootScope.user.openedGroupsData[gID].data[i].id === mID){
                    $timeout(function () {
                        $rootScope.$apply(function () {
                            $rootScope.user.openedGroupsData[gID].data.splice(i,1);
                        });
                    });
                    break;
                }
            }
        }

        //details contains mID, data, modify
        function tryModifyMessage(gID, details) {
            for(let i=0; i<$rootScope.user.openedGroupsData[gID].data.length; ++i){
                if($rootScope.user.openedGroupsData[gID].data[i].id === details.mID){
                    const msg = $rootScope.user.openedGroupsData[gID].data[i];
                    $timeout(function () {
                        $rootScope.$apply(function () {
                            msg.data = details.data;
                            msg.modify = details.modify;
                            msg.date = dashboardService.configureDate(new Date(),new Date(msg.time)) +
                                ' (Last modified: ' + dashboardService.configureDate(new Date(), new Date(details.modify)) +')';
                        });
                    });
                    break;
                }
            }
        }
    }
})();
