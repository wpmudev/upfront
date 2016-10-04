(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command-undo'
    ], function ( Command_Undo ) {

        return Command_Undo.extend({
            on_click: function() {
                alert('This is just placeholder.');
            }
        });

    });
}(jQuery));