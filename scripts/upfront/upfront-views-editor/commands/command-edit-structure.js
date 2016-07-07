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
            className: "command-link command-edit-structure",
            render: function (){
                this.$el.html(l10n.edit_grid);
                this.$el.prop("title", l10n.edit_grid);
            },
            on_click: function () {
                Upfront.Events.trigger("command:layout:edit_structure");
            }
        });

    });
}(jQuery));