(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command',
        'scripts/upfront/upfront-views-editor/fields',
        "scripts/upfront/upfront-views-editor/breakpoint/storage"
    ], function ( Command, Fields, breakpoints_storage ) {

        return Command.extend({
            className: 'activate-breakpoints-dropdown',
            enabled: true,
            initialize: function() {
                var breakpoints = breakpoints_storage.get_breakpoints();

                this.fields = [
                    new Fields.Field_Compact_Label_Select({
                        multiple: true,
                        label_text: l10n.activate_breakpoints,
                        collection: breakpoints
                    })
                ];
            },
            render: function () {
                this.fields[0].render();
                this.$el.append(this.fields[0].el);
                this.fields[0].delegateEvents();
            },
            on_click: function () {

            }
        });

    });
}(jQuery));