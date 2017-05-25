(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            tagName: 'div',
            className: "command-open-font-manager sidebar-commands-small-button field-grid-half",
            render: function (){
                this.$el.html('<span title="'+ l10n.theme_font_manager +'">' + l10n.theme_font_manager + '</span>');
            },
            on_click: function () {
                Upfront.Events.trigger('command:themefontsmanager:open');
            }
        });

    });
}(jQuery));