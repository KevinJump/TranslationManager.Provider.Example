(function () {
    'use strict';

    function exampleCreateController($scope) {

        var vm = this;

        $scope.vm.job.providerOptions = $scope.vm.settings;

        var evts = [];

        evts.push($scope.$watch('vm.settings', function (newValue, oldValue) {

            if (newValue !== undefined) {
                $scope.vm.job.providerOptions = $scope.vm.settings;
            }
        }));

        evts.push($scope.$watch('vm.job.providerOptions', function (value, old) {
            if (value != undefined) {
                $scope.vm.isValid = value.checked;
            }
        }, true))

        // unsubscribe
        $scope.$on('$destroy', function () {
            for (var e in evts) {
                e();
            }
        });
    }

    angular.module('umbraco')
        .controller('translateExampleCreateController', exampleCreateController);

})();