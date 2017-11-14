(function () {
    'use strict';

    angular
        .module('starterApp')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = [];
    function DashboardController() {
        var vm = this;
    }
})();