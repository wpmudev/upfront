(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "scripts/upfront/upfront-views-editor/settings/settings-item",
        "scripts/upfront/upfront-views-editor/fields"
    ], function (SettingsItem, Fields) {
        return SettingsItem.extend({
            //className: "upfront-settings-item upfront-settings-item-lightbox",
            initialize: function (opts) {
                this.options = opts;
                var lightboxes = this.get_lightboxes()
                    ;

                this.options.fields = _([
                    new Fields.Select({
                        model: this.model, property: 'lightbox_target',
                        values: lightboxes
                    })
                ]);

                SettingsItem.prototype.initialize.call(this, this.options);
            },
            get_lightboxes: function () {
                var regions = Upfront.Application.layout.get("regions"),
                    lightboxes = ['']
                    ;

                _.each(regions.models, function (model) {
                    if (model.attributes.sub == 'lightbox')
                        lightboxes.push({label: model.attributes.title, value: model.attributes.name});
                });


                return lightboxes;
            },
            get_values: function () {
                return this.fields._wrapped[0].get_value();
            }
        });
    });
}(jQuery));