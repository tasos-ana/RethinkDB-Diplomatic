(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('settingsService', settingsService);

    settingsService.$inject = ['$rootScope', '$location', 'httpService'];
    function settingsService($rootScope, $location, httpService) {
        const service = {};

        service.editGroupName   = _editGroupName;
        service.deleteGroup     = _deleteGroup;

        return service;

        function _editGroupName(gID,newName) {
            console.log('change name to: ' +newName +'for group: '+gID);
        }
        
        function _deleteGroup(gID) {
            console.log('delete group: '+ gID);
        }
    }
})();