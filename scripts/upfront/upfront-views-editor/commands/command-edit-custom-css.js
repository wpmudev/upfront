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
            className: "command-edit-css sidebar-commands-small-button",
            render: function (){
                this.$el.html(l10n.add_custom_css_rules);
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
								
                // needs to close this when starting Responsive Mode
                Upfront.Events.on("upfront:start:responsive", function() {
                    // do not proceed if not existing in DOM anymore
                    if ( !$.contains(document.documentElement, editor.$el.get(0)) ) return;
                    editor.close();
                });
								
                // needs to close this when activating Element Settings
                Upfront.Events.on("element:settings:activate", function() {
                    // do not proceed if not existing in DOM anymore
                    if ( !$.contains(document.documentElement, editor.$el.get(0)) ) return;
                    editor.close();
                });
            }
        });

    });
}(jQuery));