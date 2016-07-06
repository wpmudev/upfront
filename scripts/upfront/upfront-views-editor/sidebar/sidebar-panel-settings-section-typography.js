(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-item-typography-editor',
        'scripts/upfront/upfront-views-editor/commands/command-edit-custom-css',
        'scripts/upfront/upfront-views-editor/commands/command-edit-layout-background',
        'scripts/upfront/upfront-views-editor/commands/command-edit-global-regions',
        'scripts/upfront/upfront-views-editor/commands/command-edit-structure'
    ], function (
        SidebarPanel_Settings_Section,
        SidebarPanel_Settings_Item_Typography_Editor,
        Command_EditCustomCSS,
        Command_EditLayoutBackground,
        Command_EditGlobalRegions,
        Command_EditStructure
    ) {

        return SidebarPanel_Settings_Section.extend({
            initialize: function () {
                this.settings = _([
                    new SidebarPanel_Settings_Item_Typography_Editor({"model": this.model})
                ]);

                //if (!Upfront.mainData.userDoneFontsIntro) return;

                this.edit_css = new Command_EditCustomCSS({"model": this.model});
                this.edit_background = new Command_EditLayoutBackground({"model": this.model});
                this.edit_global_regions = new Command_EditGlobalRegions({"model": this.model});
                if ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.THEME ) {
                    this.edit_structure = new Command_EditStructure({"model": this.model});
                }
            },
            get_title: function () {
                return l10n.typography;
            },
            on_render: function () {
                this.$el.find('.panel-section-content').addClass('typography-section-content');

                //if (!Upfront.mainData.userDoneFontsIntro) return;

                this.edit_css.render();
                this.edit_css.delegateEvents();
                this.$el.find('.panel-section-content').append(this.edit_css.el);
                if ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.THEME ) {
                    this.edit_structure.render();
                    this.edit_structure.delegateEvents();
                    this.$el.find('.panel-section-content').append(this.edit_structure.el);
                }
                this.edit_background.render();
                this.edit_background.delegateEvents();
                this.$el.find('.panel-section-content').append(this.edit_background.el);
                this.edit_global_regions.render();
                this.edit_global_regions.delegateEvents();
                this.$el.find('.panel-section-content').append(this.edit_global_regions.el);
            }
        });
    });
}(jQuery));