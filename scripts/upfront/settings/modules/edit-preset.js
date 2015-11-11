define([
	'scripts/upfront/settings/modules/base-module',
	'scripts/upfront/settings/fields/show-state',
	'scripts/upfront/preset-settings/state-settings'
], function(BaseModule, ShowStateSettingsButton, StateSettings) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var EditPresetModule = BaseModule.extend({
		className: 'preset_specific',

		initialize: function(options) {
			this.options = options || {};

			this.listenTo(this.model, 'change', this.onPresetUpdate);

			var me = this,
				firstStateButton = false,
				firstStateSettings = false;

			if((Upfront.Application.get_current() === Upfront.Application.MODE.THEME || this.options.model.get('theme_preset') !== true)
					&& this.options.model.get('id') !== 'default') {
				var fields = [
					new Upfront.Views.Editor.Field.Button({
						model: this.model,
						label: l10n.delete_label,
						className: 'delete_preset',
						compact: true,
						on_click: function() {
							if (confirm('Are you sure to delete this preset?')) {
								me.deletePreset();
							}
						}
					})
				];
			} else if(Upfront.Application.get_current() !== Upfront.Application.MODE.THEME
						&& (this.options.model.get('id') === 'default' || this.options.model.get('theme_preset') === true)) {
				var fields = [
					new Upfront.Views.Editor.Field.Button({
						model: this.model,
						label: 'Reset',
						className: 'delete_preset',
						compact: true,
						on_click: function() {
							me.resetPreset();
						}
					})
				];
			} else {
				var fields = [];
			}

			// First add global settings
			_.each(this.options.stateModules, function(stateModules, state) {
				if(state === "Global") {
					var stateSettings = new StateSettings({
						model: this.model,
						modules: stateModules,
						state: state
					});
					fields.push(stateSettings);
				}
			}, this);

			// Than add settings state tabs
			_.each(this.options.stateModules, function(stateModules, state) {
				if(state !== "Global") {
					var showStateButton = new ShowStateSettingsButton({
						state: state
					});
					fields.push(showStateButton);
					this.listenTo(showStateButton, 'upfront:presets:state_show', this.showState);

					if (!firstStateButton) {
						firstStateButton = showStateButton;
					}
				}
			}, this);

			// Than add non-global settings state panels
			_.each(this.options.stateModules, function(stateModules, state) {
				if(state !== "Global") {
					var stateSettings = new StateSettings({
						model: this.model,
						modules: stateModules,
						state: state
					});
					fields.push(stateSettings);
					if (!firstStateSettings) {
						firstStateSettings = stateSettings;
					} else {
						stateSettings.$el.hide();
					}
				}
			}, this);

			//Wrap tab buttons
			setTimeout(function(){
				me.$el.find('.state_settings_button').wrapAll('<div class="state_settings_button_wrapper">');

				var wrapper = me.$el.find('.state_settings_button_wrapper');
				if(wrapper.prev().hasClass('delete_preset')) {
					wrapper.addClass('move-wrapper-top');
				}
			}, 50);

			if (firstStateButton) firstStateButton.$el.addClass('active');
			if (firstStateSettings) firstStateSettings.$el.show();

			this.fields =_(fields);
		},

		onPresetUpdate: function() {
			this.trigger('upfront:presets:update', this.model.toJSON());
		},

		deletePreset: function() {
			this.trigger('upfront:presets:delete', this.model);
		},

		resetPreset: function() {
			this.trigger('upfront:presets:reset', this.model);
		},

		showState: function(state) {
			this.$el.find('.state_settings_button').removeClass('active');
			this.$el.find('.state_settings_button_' + state).addClass('active');
			this.$el.find('.state_settings').hide();
			this.$el.find('.state_settings_' + state).show();
			this.trigger('upfront:presets:state_show', state);
		}
	});

	return EditPresetModule;
});
