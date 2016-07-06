(function(Backbone) {

    define([
        'scripts/upfront/upfront-views-editor/presets/button/model'
    ], function( ButtonPresetModel ) {

        var ButtonPresetsCollection = Backbone.Collection.extend({
            model: ButtonPresetModel
        });

        return new ButtonPresetsCollection(Upfront.mainData.buttonPresets);

    });
})(Backbone);