define([
	'scripts/upfront/preset-settings/show-state-settings-button',
	'scripts/upfront/preset-settings/state-settings'
], function(ShowStateSettingsButton, StateSettings) {
	var EditPresetItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'preset_specific',

		get_title: function() {
			return 'Edit ' + this.options.model.get('name');
		},

		initialize: function(options) {
			this.options = options || {};

			var me = this,
				firstStateButton = false,
				firstStateSettings = false;

			var fields = [
				new Upfront.Views.Editor.Field.Button({
					model: this.model,
					label: 'Delete Preset',
					className: 'delete_preset',
					compact: true,
					on_click: function() {
						me.deletePreset();
					}
				})
			];

			// First add settings state selectors
			_.each(this.options.stateFields, function(stateFields, state) {
				var showStateButton = new ShowStateSettingsButton({
					state: state
				});
				fields.push(showStateButton);
				this.listenTo(showStateButton, 'upfront:presets:state_show', this.showState);

				if (!firstStateButton) {
					firstStateButton = showStateButton;
				}
			}, this);

			// Than add settings state settings
			_.each(this.options.stateFields, function(stateFields, state) {
				var stateSettings = new StateSettings({
					model: this.model,
					fields: stateFields,
					state: state
				});
				fields.push(stateSettings);
				if (!firstStateSettings) {
					firstStateSettings = stateSettings;
				} else {
					stateSettings.$el.hide();
				}
			}, this);

			firstStateButton.$el.addClass('active');
			firstStateSettings.$el.show();

			this.fields =_(fields);
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
