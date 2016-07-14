(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-item-typography-editor',
        'scripts/upfront/upfront-views-editor/commands/command-general-edit-custom-css'
    ], function ( SidebarPanel_Settings_Section, SidebarPanel_Settings_Item_Typography_Editor, Command_EditCustomCSS ) {

        return SidebarPanel_Settings_Section.extend({
            initialize: function () {
                this.settings = _([
                    new SidebarPanel_Settings_Item_Typography_Editor({"model": this.model})
                ]);
                this.edit_css = new Command_EditCustomCSS({"model": this.model});
            },
            get_title: function () {
                return l10n.typography_and_colors;
            },
            on_render: function () {
                this.edit_css.render();
                this.edit_css.delegateEvents();
                this.$el.find('.panel-section-content').append(this.edit_css.el);
            }
        });

    });
}(jQuery));
