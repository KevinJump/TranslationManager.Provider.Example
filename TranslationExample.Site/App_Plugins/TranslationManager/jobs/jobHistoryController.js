(function () {
    'use strict';

    function jobHistoryController($scope, translateJobService) {

        var vm = this;
        vm.history = [];
        vm.loading = true;
        vm.close = close;

        vm.page = {
            title: 'Job history',
            description: 'Job history'
        };

        vm.jobId = $scope.model.jobId;
        vm.job = $scope.model.job;

        if (vm.job !== undefined) {
            vm.page.title = vm.job.Name +
                ' [ ' + vm.job.SourceCulture.DisplayName + ' to ' +
                vm.job.TargetCulture.DisplayName + ' ] ';

        }

        getJobHistory(vm.jobId);

        function getJobHistory(id) {

            translateJobService.getJobHistory(id)
                .then(function (result) {
                    vm.history = result.data;
                    vm.loading = false; 
                });
        }

        function close() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        }

    };

    angular.module('umbraco')
        .controller('translateJobHistoryController', jobHistoryController);
})();