define([
	'elements/upfront-tabs/js/settings/show-state-settings-button',
	'elements/upfront-tabs/js/settings/state-settings/active',
	'elements/upfront-tabs/js/settings/state-settings/hover',
	'elements/upfront-tabs/js/settings/state-settings/static'
], function(ShowStateSettingsButton, ActiveStateSettings, HoverStateSettings, StaticStateSettings) {
	var EditPresetItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'preset_specific',

		get_title: function() {
			return 'Edit ' + this.options.model.get('name');
		},

		initialize: function(options) {
			this.options = options || {};

			var me = this;

			var showActiveButton = new ShowStateSettingsButton({
				state: 'Active'
			});
			this.listenTo(showActiveButton, 'upfront:presets:state_show', this.showState);
			showActiveButton.$el.addClass('active');

			var showHoverButton = new ShowStateSettingsButton({
				state: 'Hover'
			});
			this.listenTo(showHoverButton, 'upfront:presets:state_show', this.showState);

			var showStaticButton = new ShowStateSettingsButton({
				state: 'Static'
			});
			this.listenTo(showStaticButton, 'upfront:presets:state_show', this.showState);

			var activeStateSettings = new ActiveStateSettings({
				model: this.model
			});

			var hoverStateSettings = new HoverStateSettings({
				model: this.model
			});
			hoverStateSettings.$el.hide();

			var staticStateSettings = new StaticStateSettings({
				model: this.model
			});
			staticStateSettings.$el.hide();

			this.fields =_([
				new Upfront.Views.Editor.Field.Button({
					model: this.model,
					label: 'Delete Preset',
					className: 'delete_preset',
					compact: true,
					on_click: function() {
						me.deletePreset();
					}
				}),
				showActiveButton,
				showHoverButton,
				showStaticButton,
				activeStateSettings,
				hoverStateSettings,
				staticStateSettings
			]);
		},

		deletePreset: function() {
			this.trigger('upfront:presets:delete', this.model);
		},

		showState: function(state) {
			this.$el.find('.state_settings_button').removeClass('active');
			this.$el.find('.state_settings_button_' + state).addClass('active');
			this.$el.find('.state_settings').hide();
			this.$el.find('.state_settings_' + state).show();
		}
	});

	return EditPresetItem;
});
