(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-item-colors-editor'
    ], function (SidebarPanel_Settings_Section, SidebarPanel_Settings_Item_Colors_Editor) {

        return SidebarPanel_Settings_Section.extend({
            initialize: function () {
                this.settings = _([]);
                this.edit_colors = new SidebarPanel_Settings_Item_Colors_Editor({"model": this.model});
            },
            get_title: function () {
                return l10n.colors_section;
            },
            on_render: function () {
                this.edit_colors.render();
                this.edit_colors.delegateEvents();
                this.$el.find('.panel-section-content').append(this.edit_colors.el);
                this.$el.addClass('colors-panel-section');
            }
        });

    });
}(jQuery));