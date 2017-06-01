(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            enabled: true,
            className: 'command-start-responsive upfront-icon upfront-icon-start-responsive sidebar-commands-small-button icon-button',
            render: function () {
                this.$el.html("<span title='"+ l10n.responsive_mode +"'>" + l10n.responsive_mode + "</span>");
            },
            on_click: function () {
                var me = this;
                Upfront.Events.trigger('upfront:start:responsive');
                Upfront.Application.start(Upfront.Application.MODE.RESPONSIVE);
            }
        });

    });
}(jQuery));