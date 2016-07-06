(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands'
    ], function (Commands) {

        return Commands.Commands.extend({
            "className": "sidebar-commands sidebar-commands-primary clearfix",
            initialize: function () {
                this.commands = _([]);
                if (Upfront.Application.user_can("CREATE_POST_PAGE")) {
                    this.commands.push(new Commands.Command_NewPost({"model": this.model}));
                    this.commands.push(new Commands.Command_NewPage({"model": this.model}));
                }
                this.commands.push(new Commands.Command_PopupList({"model": this.model}));

                if (Upfront.Application.user_can_modify_layout()) {
                    this.commands.push(new Commands.Command_OpenMediaGallery());
                }
            }
        });

    });
}(jQuery, Backbone));