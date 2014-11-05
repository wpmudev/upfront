define([
	'elements/upfront-tabs/js/settings/font-settings-item'
], function(FontSettingsItem) {
	var HoverStateSettings = Upfront.Views.Editor.Settings.Item.extend({
		state: 'Hover',
		group: false,
		className: 'state_settings state_settings_hover',

		initialize: function(options) {
			this.options = options || {};

			var me = this;

			this.fontSettingsItem = new FontSettingsItem({
				model: this.model,
				state: 'hover'
			});

			this.duration= new Upfront.Views.Editor.Field.Number({
				className: 'duration',
				model: this.model,
				name: 'hover-transition-duration',
				min: 0,
				label: 'Animate Hover Changes:',
				step: 0.1,
				values: [
					{ label: '', value: '12' }
				],
				change: function(value) {
					me.model.set({'hover-transition-duration': value});
				}
			});

			this.transition = new Upfront.Views.Editor.Field.Select({
				model: this.model,
				name: 'hover-transition-easing',
				label: 'sec',
				step: 0.1,
				label_style: 'inline',
				values: [
					{ label: 'ease', value: 'ease' },
					{ label: 'linear', value: 'linear' },
					{ label: 'ease-in', value: 'ease-in' },
					{ label: 'ease-out', value: 'ease-out' },
					{ label: 'ease-in-out', value: 'ease-in-out' }
				],
				className: 'transition hover',
				change: function(value) {
					me.model.set({'hover-transition-easing': value});
				}
			}),

			this.fields = _([
				this.fontSettingsItem,
				this.duration,
				this.transition
			]);
		}
	});

	return HoverStateSettings;
});
