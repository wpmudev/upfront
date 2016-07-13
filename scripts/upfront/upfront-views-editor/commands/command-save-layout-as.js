(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {
        return Command.extend({
            render: function () {
                this.$el.html(l10n.save_as);
                this.$el.prop("title", l10n.save_as);
            },
            on_click: function () {
                Upfront.Events.trigger("command:layout:save_as");
            }

        });
    });
}(jQuery));