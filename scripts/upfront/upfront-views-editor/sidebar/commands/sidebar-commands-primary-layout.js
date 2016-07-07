(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands'
    ], function (Commands) {

        /**
         * DEPRECATED
         */
        return Commands.Commands.extend({
            "className": "sidebar-commands sidebar-commands-primary clearfix",
            initialize: function () {
                this.commands = _([
                    new Commands.Command_ThemesDropdown({"model": this.model})
                ]);
                if ( Upfront.themeExporter.currentTheme !== 'upfront') {
                    this.commands.push(new Commands.Command_NewLayout({"model": this.model}));
                    this.commands.push(new Commands.Command_BrowseLayout({"model": this.model}));
                }
            }
        });

    });
}(jQuery));