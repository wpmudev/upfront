(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command',
        'scripts/upfront/upfront-views-editor/css'
    ], function ( Command, CSS ) {

        return Command.extend({
            tagName: 'div',
            className: "command-edit-css upfront-icon upfront-icon-edit-css",
            initialize: function() {
                this.lazy_save_styles = _.debounce(function(styles) {
                    this.model.set({ styles: styles });
                }, 1000);
            },
            render: function () {
                this.$el.html('<span title="'+ l10n.add_custom_css_rules +'">' + l10n.add_custom_css_rules + '</span>');
            },
            on_click: function () {
                var editor,
                    me = this;

                editor = new CSS.GeneralCSSEditor({
                    model: this.model,
                    page_class: this.model.get('id') + '-breakpoint',
                    type: "Layout",
                    sidebar: false,
                    global: true,
                    change: function(content) {
                        me.lazy_save_styles(content);
                    }
                });
								
                // this will be used when Inserting Font on Responsive Global Theme CSS
                Upfront.Application.generalCssEditor = editor;

                Upfront.Events.on("upfront:layout_size:change_breakpoint", function() {
                    editor.close();
                });
								
                // needs to close this when exiting Responsive Mode
                Upfront.Events.on("upfront:exit:responsive", function() {
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