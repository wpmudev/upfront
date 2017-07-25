(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-item-typography-editor',
        'scripts/upfront/upfront-views-editor/commands/command-edit-custom-css',
    ], function (
        SidebarPanel_Settings_Section,
        SidebarPanel_Settings_Item_Typography_Editor,
        Command_EditCustomCSS
    ) {

        return SidebarPanel_Settings_Section.extend({
            initialize: function () {
                this.settings = _([
                    new SidebarPanel_Settings_Item_Typography_Editor({"model": this.model})
                ]);

                //if (!Upfront.mainData.userDoneFontsIntro) return;

                this.edit_css = new Command_EditCustomCSS({"model": this.model});

				this.listenTo(Upfront.Events, "entity:breakpoint:change", this.update_buttons_position);
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

				var me = this;
				// When color spectrum is shown, set positions
				Upfront.Events.on("color:spectrum:show", function() {
					me.$el.closest('.sidebar-panel-content.ps-theme-default').css('position', 'static');
					me.$el.closest('.sidebar-panel-settings').css('position', 'relative');
				});
				// When color spectrum is hidden, reset positions
				Upfront.Events.on("color:spectrum:hide", function() {
					me.$el.closest('.sidebar-panel-content.ps-theme-default').css('position', 'relative');
					me.$el.closest('.sidebar-panel-settings').css('position', 'static');
				});

				this.$el.find('.open-theme-fonts-manager').after(this.$el.find('.command-edit-css'));
				this.$el.find('.command-edit-css').before(this.$el.find('.command-open-font-manager'));
			},

			update_buttons_position: function() {
				// Move Theme Fonts Manager button to bottom
				$('.open-theme-fonts-manager').after($('.command-edit-css'));
				$('.command-edit-css').before($('.command-open-font-manager'));
			}
        });
    });
}(jQuery));
