(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            className: "command-export upfront-icon upfront-icon-export",
            render: function (){
                this.$el.text(l10n.export_str);
            },
            on_click: function () {
                $('div.redactor_editor').each(function() {
                    var ed = $(this).data('ueditor');
                    if(ed)
                        ed.stop();
                });
                Upfront.Events.trigger("command:layout:export_theme");
            }
        });

    });
}(jQuery));