(function () {
    'use strict';

    function pickerDashboardController($scope, editorService, translateNodeService) {

        var vm = this;
        vm.items = [];

        vm.pickContent = pickContent;
        vm.remove = remove;
        vm.create = create;
        vm.valid = false; 

        function pickContent() {

            var options = {
                multiPicker: true,
                submit: function (model) {
                    select(model.selection);
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }


            }
            editorService.contentPicker(options);
        }

        function create() {
            editorService.open({
                title: 'Create Job',
                items: vm.items,
                view: Umbraco.Sys.ServerVariables.translationManager.plugin + 'app/createDialog.html',
                size: 'small',
                submit: function () {
                    refresh();
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            });
        }

        function select(items) {


            var pathIds = [];

            _.each(items, function (item) {

                if (_.findIndex(vm.items, { id: item.id }) === -1) {
                    vm.items.push(item);
                    item.tm_includeChildren = false; 
                    pathIds.push(item.id);
                }
            });
            loadNodesInfo(pathIds);
        }

        function loadNodesInfo(ids) {

            console.log(ids);

            translateNodeService.loadNodesInfo(ids, 'id')
                .then(function (result) {
                    var paths = result.data;

                    _.each(paths, function (node) {

                        var x = _.find(vm.items, function (item) {
                            return item.id == node.Id;
                        });
                        if (x !== undefined) {
                            x.tm_friendlyPath = node.tm_friendlyPath;
                            x.tm_setKey = node.tm_setKey;
                            x.tm_setName = node.tm_setName;
                        }
                    });

                    checkSets();

                });
        }

        function checkSets() {

            let setKey = '';
            if (vm.items.length == 0) { vm.valid = false; }

            _.each(vm.items, function (item) {
                if (item.tm_setKey != setKey) {
                    if (setKey == '' && item.tm_setKey != '00000000-0000-0000-0000-000000000000') {
                        setKey = item.tm_setKey;
                        vm.valid = true;
                    }
                    else {
                        vm.valid = false;
                    }
                }
            });
        }

        function remove(item) {

            vm.items = _.without(vm.items, _.findWhere(vm.items, {
                id: item.id
            }));

            checkSets();
        }

    }

    angular.module('umbraco')
        .controller('tmPickerDashboardController', pickerDashboardController);
})();