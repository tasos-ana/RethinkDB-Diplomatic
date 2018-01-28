(function () {
    'use strict';

    angular
        .module('starterApp')
        .filter('reverse',reverse);

    /**
     * Filter for reverse item on ng-repeat
     */
    reverse.$inject =[];
    function reverse() {
        return function(items) {
            if(typeof items === 'undefined') { return; }
            return angular.isArray(items) ?
                items.slice().reverse() : // If it is an array, split and reverse it
                (items + '').split('').reverse().join(''); // else make it a string (if it isn't already), and reverse it
        };
    }
})();