(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            className: "command-trash sidebar-commands-button light upfront-icon upfront-icon-trash",
            render: function () {
                this.listenTo(Upfront.Events, 'click:edit:navigate', this.toggle);
                this.$el.html(l10n.trash);
                this.toggle();
            },
            toggle: function (postId) {
                if(typeof postId !== "undefined") {
                    if(postId === false) {
                        this.$el.hide();
                    } else {
                        this.$el.show();
                    }
                } else {
                    if (typeof _upfront_post_data === "undefined" || _upfront_post_data.post_id === false) {
                        this.$el.hide();
                    } else {
                        this.$el.show();
                    }
                }
            },
            on_click: function () {
                Upfront.Events.trigger("command:layout:trash");
            }
        });

    });
}(jQuery));