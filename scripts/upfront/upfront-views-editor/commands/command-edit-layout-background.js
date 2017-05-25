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
            className: "command-link command-edit-bg sidebar-commands-small-button field-grid-half field-grid-half-last",
            render: function (){
                this.$el.text(l10n.edit_global_bg);
                this.$el.prop("title", l10n.edit_global_bg);
            },
            on_click: function () {
                Upfront.Events.trigger("command:layout:edit_background");
            }
        });

    });
}(jQuery));