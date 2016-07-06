(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "scripts/upfront/upfront-views-editor/settings/settings-lightbox-trigger",
        'scripts/upfront/upfront-views-editor/fields'
    ], function (Settings_LightboxTrigger, Fields) {
        return Settings_LightboxTrigger.extend({
            //className: "upfront-settings-item upfront-settings-item-anchor",
            initialize: function (opts) {
                this.options = opts;
                Settings_LightboxTrigger.prototype.initialize.call(this, this.options);
                this.options.fields.push(
                    new Fields.Text({
                        model: this.model,
                        property: 'lightbox_label',
                        label: l10n.label
                    })
                );
            },
            get_values: function () {
                return {
                    anchor: this.fields._wrapped[0].get_value(),
                    label: this.fields._wrapped[1].get_value()
                };
            }
        });

    });
}(jQuery));
