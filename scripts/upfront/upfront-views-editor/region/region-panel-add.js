(function(){

    define([
        "scripts/upfront/inline-panels/inline-panels",
        "scripts/upfront/upfront-views-editor/region/region-panel-item-add-region"
    ], function ( InlinePanels, RegionPanelItem_AddRegion ) {
        return InlinePanels.Panel.extend({
            initialize: function (opts) {
                this.options = opts;
                if (!this.options.to)
                    this.options.to = 'bottom';
                var to = this.options.to,
                    args = {model: this.model, to: to}
                    ;
                if (this.options.width)
                    args.width = this.options.width;
                if (this.options.height)
                    args.height = this.options.height;
                this.items = _([new RegionPanelItem_AddRegion(args)]);
                if (to == 'top' || to == 'bottom') {
                    this.position_v = to;
                    this.position_h = 'center';
                }
                else if (to == 'left' || to == 'right') {
                    this.position_v = 'center';
                    this.position_h = to;
                }
                else if (to == 'top-left' || to == 'top-right' || to == 'bottom-left' || to == 'bottom-right') {
                    this.position_v = to.split('-')[0];
                    this.position_h = to.split('-')[1];
                }
            },
            items: function () {
                return _([this.add_region]);
            }
        });

    });
}());