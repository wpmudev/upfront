(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            className: "command-preview",
            can_preview: false,
            render: function () {
                this.$el.addClass('command-save command-preview upfront-icon upfront-icon-save');
                //this.$el.html("Preview");
                this.preview_built();
                Upfront.Events.on("preview:build:start", this.building_preview, this);
                Upfront.Events.on("preview:build:stop", this.preview_built, this);
            },
            on_click: function () {
                if (this.can_preview) Upfront.Events.trigger("command:layout:preview");
            },
            building_preview: function () {
                this.$el.html(l10n.building);
                this.can_preview = false;
            },
            preview_built: function () {
                this.$el.html(l10n.preview);
                this.$el.prop("title", l10n.preview);
                this.can_preview = true;
            }

        });

    });
}(jQuery));