(function(){

    define([
        "scripts/upfront/upfront-views-editor/region/region-panel-item"
    ], function ( RegionPanelItem ) {
        return RegionPanelItem.extend({
            events: {
                'click .upfront-icon': 'toggle_lock'
            },
            className: 'upfront-inline-panel-item upfront-region-panel-item-expand-lock',
            icon: function () {
                var locked = this.model.get_property_value_by_name('expand_lock');
                return locked ? 'expand-lock' : 'expand-unlock';
            },
            tooltip: function () {
                var locked = this.model.get_property_value_by_name('expand_lock'),
                    status = '<span class="' + (locked ? 'expand-lock-active' : 'expand-lock-inactive') + '">' + (locked ? l10n.off : l10n.on) + '</span>';
                return l10n.autoexpand.replace(/%s/, status);
            },
            toggle_lock: function () {
                var locked = this.model.get_property_value_by_name('expand_lock');
                this.model.set_property('expand_lock', !locked);
                this.render_icon();
                this.render_tooltip();
            }
        });

    });
}());