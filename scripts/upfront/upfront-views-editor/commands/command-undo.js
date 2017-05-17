(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            "className": "command-undo sidebar-commands-small-button icon-button",
            initialize: function () {
                //Upfront.Events.on("entity:activated", this.activate, this);
                //Upfront.Events.on("entity:deactivated", this.deactivate, this);
                Upfront.Events.on("command:undo", this.render, this);
                Upfront.Events.on("command:redo", this.render, this);

                // Re-activate on stored state
                Upfront.Events.on("upfront:undo:state_stored", this.render, this);

                this.deactivate();
            },
            render: function () {
                this.$el.addClass('upfront-icon upfront-icon-undo');
                // We do not need label anymore
                // this.$el.html(l10n.undo);
                this.$el.prop("title", l10n.undo);
                if (this.model.has_undo_states()) this.activate();
                else this.deactivate();
            },
            activate: function () {
                this.$el.addClass("disabled");
            },
            deactivate: function () {
                this.$el.removeClass("disabled");
            },
            on_click: function () {
                var me = this,
                    dfr = false,
                    loading = new Upfront.Views.Editor.Loading({
                        loading: l10n.undoing,
                        done: l10n.undoing_done,
                        fixed: true
                    })
                    ;
                loading.render();
                $('body').append(loading.$el);

                dfr = me.model.restore_undo_state();
                if (dfr && dfr.done) {
                    dfr.done(function () {
                        Upfront.Events.trigger("command:undo");
                        me.render();
                        loading.done();
                    });
                } else {
                    setTimeout(function () {
                        loading.done();
                    }, 100);
                }
            }
        });

    });
}(jQuery));