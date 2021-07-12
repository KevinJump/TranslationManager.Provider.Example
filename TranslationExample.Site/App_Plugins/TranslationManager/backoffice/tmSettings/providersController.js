(function () {
    'use strict';

    function providersController(translateSettingsService) {

        var vm = this;

        vm.providers = [];


        translateSettingsService.getProvidersContent()
            .then(function (result) {
                vm.providers = result.data.providers;
            });
    }

    angular.module('umbraco')
        .controller('translateProviderViewController', providersController);

})();