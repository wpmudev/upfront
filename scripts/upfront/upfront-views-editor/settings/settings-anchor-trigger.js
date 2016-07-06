(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/settings/settings-item',
        'scripts/upfront/upfront-views-editor/fields'
    ], function (SettingsItem, Fields) {
        return SettingsItem.extend({
            //className: "upfront-settings-item upfront-settings-item-anchor",
            initialize: function (opts) {
                this.options = opts;
                var anchors = [],
                    raw = this.get_anchors()
                    ;
                _(raw).each(function (idx) {
                    anchors.push({label: idx, value: idx});
                });
                this.options.fields = _([
                    new Fields.Select({
                        model: this.model, property: 'anchor_target',
                        values: anchors
                    })
                ]);
                SettingsItem.prototype.initialize.call(this, this.options);
            },
            get_anchors: function () {
                var regions = Upfront.Application.layout.get("regions"),
                    anchors = ['']
                    ;
                regions.each(function (r) {
                    r.get("modules").each(function (module) {
                        module.get("objects").each(function (object) {
                            var anchor = object.get_property_value_by_name("anchor");
                            if (anchor && anchor.length) anchors.push(anchor);
                        });
                    });
                });
                return anchors;
            },
            get_values: function () {
                return this.fields._wrapped[0].get_value();
            }
        });
    });
}(jQuery));