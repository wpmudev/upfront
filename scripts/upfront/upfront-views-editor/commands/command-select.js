(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            initialize: function () {
                Upfront.Events.on("command:merge", this.on_click, this);
            },
            render: function () {
                this.$el.html("Select mode " + (this._selecting ? 'on' : 'off'));
                this.$el.html((
                    this._selecting
                        ? l10n.select_mode_on
                        : l10n.select_mode_off
                ));
            },
            on_click: function () {
                if (!this._selecting) Upfront.Events.trigger("command:select");
                else Upfront.Events.trigger("command:deselect");
                this._selecting = !this._selecting;
                this.render();
            }
        });

    });
}(jQuery));