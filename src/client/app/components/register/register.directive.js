(function () {
    'use strict';

    angular
    .module('registerDirective',[])
        .directive('pwMatch', [function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    var password = '#' + attrs.pwMatch;
                    elem.add(password).on('keyup', function () {
                        scope.$apply(function () {
                            ctrl.$setValidity('pwMatch', elem.val() === $(password).val());
                        });
                    });
                }
            }
        }]);

    // var pwMatch = function () {
    //     return {
    //         require: 'ngModel',
    //         link: function (scope, elem, attrs, ctrl) {
    //             var password = '#' + attrs.pwMatch;
    //             elem.add(password).on('keyup', function () {
    //                 scope.$apply(function () {
    //                     ctrl.$setValidity('pwMatch', elem.val() === $(password).val());
    //                 });
    //             });
    //         }
    //     };
    // };

}());