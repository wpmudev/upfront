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
        'scripts/upfront/upfront-views-editor/commands/command-edit-global-regions'
    ], function (
        SidebarPanel_Settings_Section,
        SidebarPanel_Settings_Item_Typography_Editor,
        Command_EditCustomCSS,
        Command_EditLayoutBackground,
        Command_EditGlobalRegions
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

								Upfront.plugins.call('insert-command-after-typography-commands', {
									rootEl: this.$el,
									model: this.model
								});

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
