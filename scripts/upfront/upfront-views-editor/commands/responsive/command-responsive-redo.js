(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command-redo'
    ], function ( Command_Redo ) {

        return Command_Redo.extend({
            on_click: function() {
                alert('This is just placeholder.');
            }
        });
    });
}(jQuery));