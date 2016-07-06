(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            className: "command-publish-layout",
            render: function () {
                this.$el.html(l10n.publish_layout);
            },
            on_click: function () {
                Upfront.Events.trigger("command:layout:publish");
            }
        });


    });
}(jQuery));