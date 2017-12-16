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

    emailExists.$inject = ['httpService', '$timeout'];
    function emailExists(httpService, $timeout) {
        return{
          restrict  : 'AE',
          require   : 'ngModel',
          link      : function (scope, element, attributes, ngModel) {

              ngModel.$asyncValidators.emailExists = function (isValid) {
                  if(isValid){
                      return httpService.accountGetUserInfo(element.val())
                          .then(function (response) {
                              $timeout(function () {
                                  ngModel.$setValidity('emailExists', !response.success);
                                  scope.emailAlreadyExist = response.success;
                              },600);
                          });
                  }
              }


          }
        };
    }
})();