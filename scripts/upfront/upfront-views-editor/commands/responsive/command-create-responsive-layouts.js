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
            className: 'command-create-responsive-layouts upfront-icon upfront-icon-start-responsive',
            render: function () {
                this.$el.html("<span title='"+ l10n.create_responsive_layouts +"'>" + l10n.create_responsive_layouts + "</span>");
            },
            on_click: function () {
                Upfront.Application.start(Upfront.Application.MODE.RESPONSIVE);
            }
        });

    });
}(jQuery));