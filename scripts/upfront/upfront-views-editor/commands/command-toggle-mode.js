(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            className: 'command-toggle-mode',
            enabled: true,
            initialize: function () {
                Upfront.Events.on('upfront:element:edit:start', this.disable_toggle, this);
                Upfront.Events.on('upfront:element:edit:stop', this.enable_toggle, this);
            },
            render: function () {
                this.$el.html(_.template(
                    "<span title='toggle editing mode'>" + l10n.current_mode + "</span>",
                    {mode: Upfront.Application.get_current()}
                ));
            },
            on_click: function () {
                if ( !this.enabled )
                    return false;
                var mode = Upfront.Application.mode && Upfront.Application.mode.current && Upfront.Application.mode.current != Upfront.Application.MODE.CONTENT
                        ? Upfront.Application.MODE.CONTENT
                        : Upfront.Application.mode.last
                    ;
                Upfront.Application.start(mode);
            },
            disable_toggle: function () {
                this.$el.css('opacity', 0.5);
                this.enabled = false;
            },
            enable_toggle: function () {
                this.$el.css('opacity', 1);
                this.enabled = true;
            }
        });

    });
}(jQuery));