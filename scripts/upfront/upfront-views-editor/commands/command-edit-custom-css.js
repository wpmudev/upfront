(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            tagName: 'div',
            className: "command-edit-css upfront-icon upfront-icon-edit-css",
            render: function (){
                this.$el.html('<span>' + l10n.add_custom_css_rules + '</span>');
                this.$el.prop("title", l10n.add_custom_css_rules);
            },
            on_click: function () {
                var editor = Upfront.Application.cssEditor,
                    save_t;

                editor.init({
                    model: this.model,
                    type: "Layout",
                    sidebar: false,
                    element_id: 'layout',
                    global: true
                });
            }
        });

    });
}(jQuery));