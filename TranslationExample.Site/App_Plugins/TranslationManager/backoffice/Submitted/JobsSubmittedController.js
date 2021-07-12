(function () {

    'use strict';

    function jobsController($scope, $routeParams, $timeout, navigationService,
        localizationService, notificationsService,
        translateJobService, translateCultureService) {

        var vm = this;
        vm.checkButtonState = 'init';

        vm.page = {
            title: 'Submitted Jobs : ',
            description: 'Jobs that have been submitted for translation'
        };

        vm.cultureId = $routeParams.id;
        vm.statusRange = [1, 9];
        vm.loaded = true;

        vm.checkJobs = checkJobs;

        getCultureInfo(vm.cultureId);

        $timeout(function () {
            navigationService.syncTree({ tree: "submitted", path: ['-1', vm.cultureId] });
        });


        function getCultureInfo(cultureId) {
            translateCultureService.getCultureInfo(cultureId)
                .then(function (result) {
                    vm.page.title += result.data.DisplayName;
                });
        }

        function checkJobs() {

            vm.checkButtonState = 'busy';
            vm.checking = true;

            translateJobService.checkAll()
                .then(function (result) {
                    vm.checking = false;
                    vm.checkButtonState = 'success';

                    if (result.data > 0) {
                        notificationsService.success('Checked', 'Updated ' + result.data + ' jobs, check received queue.');
                    }
                    else {
                        notificationsService.info('Checked', 'No translation jobs updated');

                    }
                    $scope.$broadcast("translate-reloaded")

                }, function (error) {
                    vm.checking = false;
                    vm.checkButtonState = 'error';
                    notificationsService.error('error',
                        'Unable to check jobs ' + error.data.ExceptionMessage);

                });
        }
    }

    angular.module('umbraco')
        .controller('translateJobsSubmittedController', jobsController);

})();