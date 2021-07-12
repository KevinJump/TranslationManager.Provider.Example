(function () {

    'use strict';

    function settingsController(
        $scope, $timeout,
        navigationService,
        notificationsService,
        translateSettingsService) {

        var vm = this;

        vm.saveSettings = saveSettings;
        vm.checkLicence = checkLicence;

        vm.licenceDetails = {
            domains: '',
            key: ''
        };

        vm.saveButtonState = 'init';

        vm.page = {
            title: 'Translation Manager settings',
            description: 'v' + Umbraco.Sys.ServerVariables.translationManager.version,
            navigation: [
                {
                    'name': 'Settings',
                    'alias': 'settings',
                    'icon': 'icon-settings',
                    'view': Umbraco.Sys.ServerVariables.translationManager.plugin + 'settings/settings.html',
                    'active': true
                },
                {
                    'name': 'licence',
                    'alias': 'licence',
                    'icon': 'icon-certificate',
                    'view': Umbraco.Sys.ServerVariables.translationManager.plugin + 'settings/licence.html'
                },
                {
                    'name': 'Notifications',
                    'alias': 'notifications',
                    'icon': 'icon-message',
                    'view': Umbraco.Sys.ServerVariables.translationManager.plugin + 'settings/notifications.html'
                },
                {
                    'name': 'Diagnostics',
                    'alias': 'diagnostics',
                    'icon': 'icon-lab',
                    'view': Umbraco.Sys.ServerVariables.translationManager.plugin + 'settings/diagnostics.html'
                }
            ]
        };

        init();


        $timeout(function () {
            navigationService.syncTree({ tree: "tmSettings", path: ['-1'] });
        });


        ////////////////////////

        function saveSettings() {
            vm.saveButtonState = 'busy';

            vm.settings.Licence.Key = vm.licenceDetails.key;
            vm.settings.Licence.Domains = vm.licenceDetails.domains;

            translateSettingsService.saveSettings(vm.settings)
                .then(function (result) {
                    notificationsService.success('Saved', 'Settings saved');
                    vm.saveButtonState = 'success';
                    getSettings();
                }, function (error) {
                    vm.saveButtonState = 'error';
                    notificationsService.error('Error', error.data.ExceptionMessage);
                });
        }

        ////////////////////////
        function init() {
            getSettings();
        }

        function getSettings() {
            vm.loading = true;
            translateSettingsService.getSettings()
                .then(function (result) {
                    vm.loading = false;
                    vm.settings = result.data;
                    vm.licenceDetails = {
                        key: vm.settings.Licence.Key,
                        domains: vm.settings.Licence.Domains
                    };
                }, function (error) {
                    vm.loading = false;
                    notificationsService.error('Error', error.data.ExceptionMessage);
                });
        }

        vm.checking = 'init';

        function checkLicence() {
            vm.checking = 'busy';
            translateSettingsService.checkLicence()
                .then(function (result) {

                    if (result.data) {
                        vm.checking = 'success';
                        getSettings();
                    }
                    else {
                        vm.checking = 'error';
                        notificationsService.warning('Check', "Licence check didn't find any updates");
                    }

                });
        }
    }

    angular.module('umbraco')
        .controller('translateSettingsViewController', settingsController);

})();