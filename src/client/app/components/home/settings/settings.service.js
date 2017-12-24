(function () {
    'use strict';

    angular
        .module('starterApp')
        .factory('settingsService', settingsService);

    settingsService.$inject = ['$rootScope', '$location', 'httpService'];
    function settingsService($rootScope, $location, httpService) {
        const service = {};

        service.updateAccountNickame    = _updateAccountNickname;
        service.updateAccountPassword   = _updateAccountPassword;
        service.updateAccount           = _updateAccount;

        return service;

        function _updateAccountNickname(vm) {

            _clearAccountSettingsForm(vm);
        }
        
        function _updateAccountPassword(vm) {

            _clearAccountSettingsForm(vm);
        }

        function _updateAccount(vm) {

            _clearAccountSettingsForm(vm);
        }

        function _clearAccountSettingsForm(vm) {
            // call that on success update
            delete vm.accountSettings;
            vm.accountSettings = {};
            vm.accountSettings.applyChanges = false;
            vm.accountSettingsForm.$setPristine();
        }


    }
})();