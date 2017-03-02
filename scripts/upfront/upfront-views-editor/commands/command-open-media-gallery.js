(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function (Command) {

        return Command.extend({
            tagName: 'li',
            className: 'command-open-media-gallery upfront-icon upfront-icon-open-gallery',
            render: function () {
                this.$el.html('<a title="'+ l10n.media +'">' + l10n.media + '</a>');
            },
            on_click: function () {
                Upfront.Media.Manager.open({
                    media_type: ["images", "videos", "audios", "other"],
                    can_toggle_control: true,
                    show_control: false,
					show_insert: false
                });
            }
        });

    });
}(jQuery));