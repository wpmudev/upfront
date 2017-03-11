(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command-save-layout'
    ], function ( Command_SaveLayout ) {

        return Command_SaveLayout.extend({
            "className": "command-save sidebar-commands-button blue",
            render: function () {
                this.$el.addClass('upfront-icon upfront-icon-save');
                this.$el.html(l10n.save_layout);
                this.$el.prop("title", l10n.save_layout);
            },
            on_click: function () {
                Upfront.Events.trigger("post:layout:save");
            }
        });


    });

}(jQuery));