(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "scripts/upfront/upfront-views-editor/region/region-panel-item"
    ], function ( RegionPanelItem ) {
        return RegionPanelItem.extend({
            events: {
                'click .upfront-icon': 'open_bg_setting'
            },
            className: 'upfront-inline-panel-item upfront-region-panel-item-bg',
            icon: function () {
                return this._active ? 'bg-setting-active' : 'bg-setting';
            },
            tooltip: l10n.change_background,
            _active: false,
            open_bg_setting: function () {
                var type = this.model.get_property_value_by_name('background_type');
                if (!type) {
                    if (this.model.get_property_value_by_name('background_image'))
                        this.model.set_property('background_type', 'image');
                }
                this._active = true;
                this.render_icon();
                this.open_modal(this.render_modal, true).always($.proxy(this.on_close_modal, this)).fail($.proxy(this.notify, this));
            }
        });

    });
}(jQuery));