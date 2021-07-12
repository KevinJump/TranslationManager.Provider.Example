(function () {
    'use strict';

    function submittedController($scope) {

        var vm = this;
        vm.job = $scope.vm.job;
        vm.properties = angular.fromJson(vm.job.ProviderProperties);
    }

    angular.module('umbraco')
        .controller('translateExampleSubmittedController', submittedController);

})();