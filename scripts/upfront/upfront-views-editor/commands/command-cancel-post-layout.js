(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            className: "command-cancel",
            render: function () {
                this.$el.html(l10n.cancel);
                this.$el.prop("title", l10n.cancel);
            },
            on_click: function () {
                Upfront.Events.trigger("post:layout:cancel");
                if ( Upfront.Application.is_builder() ) {
                    Upfront.Events.trigger("post:layout:post:style:cancel");
                }
            }
        });


    });
}(jQuery));