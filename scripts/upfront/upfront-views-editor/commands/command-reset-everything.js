(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            className: 'command-reset-everything',
            render: function () {
                this.$el.html("<span title='" + l10n.destroy_layout + "'>" + l10n.reset_everything + "</span>");
            },
            on_click: function () {
                Upfront.Util.reset()
                    .success(function () {
                        Upfront.Util.log("layout reset");
                        window.location.reload();
                    })
                    .error(function () {
                        Upfront.Util.log("error resetting layout");
                    })
                ;
            }
        });

    });
}(jQuery));