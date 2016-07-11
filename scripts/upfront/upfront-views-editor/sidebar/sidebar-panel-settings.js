(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section-typography',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section-colors'
    ], function ( SidebarPanel, SidebarPanel_Settings_Section_Typography, SidebarPanel_Settings_Section_Colors ) {

        return SidebarPanel.extend({
            "className": "sidebar-panel sidebar-panel-settings",
            initialize: function () {
                this.active = true;
                this.global_option = true;
                this.sections = _([
                    new SidebarPanel_Settings_Section_Typography({"model": this.model}),
                    new SidebarPanel_Settings_Section_Colors({"model": this.model})
                ]);
            },
            get_title: function () {
                return l10n.theme_settings;
            },
            on_render: function () {
							Upfront.plugins.call('do-action-after-sidebar-settings-render', {settingsEl: this.$el});
            }
        });

    });
}(jQuery));
