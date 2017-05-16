(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section',
		'scripts/upfront/upfront-views-editor/commands/command-edit-global-regions',
		'scripts/upfront/upfront-views-editor/commands/command-edit-layout-background'
    ], function (SidebarPanel_Settings_Section, Command_EditGlobalRegions, Command_EditLayoutBackground) {

        return SidebarPanel_Settings_Section.extend({
            initialize: function () {
                this.settings = _([]);
				this.edit_global_regions = new Command_EditGlobalRegions({"model": this.model});
				this.edit_background = new Command_EditLayoutBackground({"model": this.model});
            },
            get_title: function () {
                return l10n.misc_section;
            },
            on_render: function () {
                this.edit_global_regions.render();
                this.edit_global_regions.delegateEvents();
				this.$el.find('.panel-section-content').append(this.edit_global_regions.el);

				this.edit_background.render();
				this.edit_background.delegateEvents();
				this.$el.find('.panel-section-content').append(this.edit_background.el);
            }
        });

    });
}(jQuery));