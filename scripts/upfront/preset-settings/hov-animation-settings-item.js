/*
* Field names properies
* `duration` - Animation duration
* `easing` - Animation effect
*/
define(function() {	
	var l10n = Upfront.Settings.l10n.button_element;
	var HovAnimationSettingsItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'hov_animation_settings_item clearfix',
		group: false,
		
		initialize: function(options) {
			this.options = options || {};
			var me = this,
				state = this.options.state;

			this.fields = _([
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'duration',
					name: me.options.fields.duration,
					min: 0,
					label: 'Animate Hover Changes:',
					step: 0.1,
					values: [
						{ label: '', value: '12' }
					],
					change: function(value) {
						me.model.set(me.options.fields.duration, value);
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					name: me.options.fields.easing,
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
						me.model.set(me.options.fields.easing, value);
					}
				}),
			]);
		},
	});

	return HovAnimationSettingsItem;
});