(function () {
    'use strict';

    angular
        .module('starterApp')
        .directive('compareTo', compareTo)
        .directive('emailExists', emailExists);

    compareTo.$inject = [];
    function compareTo() {
        return {
            require: "ngModel",
            scope: {
                otherModelValue: "=compareTo"
            },
            link: function(scope, element, attributes, ngModel) {

                ngModel.$validators.compareTo = function(modelValue) {
                    return modelValue === scope.otherModelValue;
                };

                scope.$watch("otherModelValue", function() {
                    ngModel.$validate();
                });
            }
        };
    }

    emailExists.$inject = [];
    function emailExists() {
        // if(isValid){
        //     httpService.accountGetUserInfo(vm.user.uEmail)
        //         .then(function (response) {
        //             vm.emailExists = response.success;
        //         });
        // }
    }
})();