(function(){

    define([
        "scripts/upfront/inline-panels/inline-panels"
    ], function ( InlinePanels ) {
        return InlinePanels.Item.extend({
            initialize: function () {
                this.on('modal:open', this.on_modal_open, this);
                this.on('modal:close', this.on_modal_close, this);
            },
            on_modal_open: function () {
                // Disable region changing
                Upfront.Events.trigger('command:region:edit_toggle', false);
            },
            on_modal_close: function () {
                // Re-enable region changing
                Upfront.Events.trigger('command:region:edit_toggle', true);
            }
        });
    });
}());