(function(){

    define([
        "scripts/upfront/upfront-views-editor/region/region-panels",
        "scripts/upfront/upfront-views-editor/region/region-panel-add"
    ], function ( RegionPanels, RegionPanel_Add ) {

        return RegionPanels.extend({
            className: 'upfront-inline-panels upfront-region-fixed-panels upfront-ui',
            initialize: function () {
                var container = this.model.get('container'),
                    name = this.model.get('name');
                this.listenTo(this.model.collection, 'add', this.render);
                this.listenTo(this.model.collection, 'remove', this.render);
                this.listenTo(Upfront.Events, "entity:region:activated", this.on_region_active);
                this.listenTo(Upfront.Events, "entity:region:deactivated", this.on_region_deactive);
                this.add_panel_top_left = new RegionPanel_Add({
                    model: this.model,
                    to: 'top-left',
                    width: 50,
                    height: 50
                });
                this.add_panel_top_right = new RegionPanel_Add({
                    model: this.model,
                    to: 'top-right',
                    width: 50,
                    height: 50
                });
                this.add_panel_bottom_left = new RegionPanel_Add({
                    model: this.model,
                    to: 'bottom-left',
                    width: 50,
                    height: 50
                });
                this.add_panel_bottom_right = new RegionPanel_Add({
                    model: this.model,
                    to: 'bottom-right',
                    width: 50,
                    height: 50
                });
            },
            panels: function () {
                var panels = _([]);
                panels.push(this.add_panel_top_left);
                panels.push(this.add_panel_top_right);
                panels.push(this.add_panel_bottom_left);
                panels.push(this.add_panel_bottom_right);
                this._panels = panels;
                return panels;
            },
            on_region_active: function (region) {
                if (region.model != this.model)
                    return;
                var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
                if ($main.hasClass('upfront-region-fixed-editing')) {
                    this.on_active();
                    this.listenToOnce(Upfront.Events, 'sidebar:toggle:done', this.update_pos);
                    $(window).on('scroll', this, this.on_scroll);
                }
            },
            remove: function () {
                this.add_panel_top_left.remove();
                this.add_panel_top_right.remove();
                this.add_panel_bottom_left.remove();
                this.add_panel_bottom_right.remove();
                this.add_panel_top_left = false;
                this.add_panel_top_right = false;
                this.add_panel_bottom_left = false;
                this.add_panel_bottom_right = false;
                Backbone.View.prototype.remove.call(this);
            }
        });

    });
}(jQuery));