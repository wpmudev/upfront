(function(Backbone) {

    define([
        'scripts/upfront/upfront-views-editor/presets/button/collection'
    ], function( ButtonPresetsCollection ) {



        return function(stored_presets) {
            var button_presets;

            var initialize = function() {
                // When more than one weights are added at once don't send bunch of server calls
                var save_button_presets_debounced = _.debounce(save_button_presets, 100);
                button_presets_collection.on('add remove edit', save_button_presets_debounced);
            };

            var save_button_presets = function() {
                var postData = {
                    action: 'upfront_update_button_presets',
                    button_presets: button_presets_collection.toJSON()
                };

                Upfront.Util.post(postData)
                    .error(function(){
                        return notifier.addMessage(l10n.button_presets_save_fail);
                    });
            };

            initialize();
        };

    });
})(Backbone);